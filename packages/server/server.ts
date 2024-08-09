import express, { Express, Request, Response, json } from "express";
import https from "https";
import fs from "fs";
import cors from "cors";
import {
  validateChallengeSubmission,
  downloadContract,
  testChallengeSubmission,
  PORT,
  validateAddress,
  validateNewUser
} from "./utils";
import { fetchChallenge, fetchChallenges } from "./services/challenge";
import { fetchUserWithChallengeAtAddress, fetchUser, createUser, updateUserChallengeSubmission } from "./services/user";
import { parseTestResults } from "./utils/parseTestResults";

export const startServer = async () => {
  const app: Express = express();
  app.use(cors());
  app.use(json());

  // Define routes
  app.get("/", (req: Request, res: Response) => {
    res.send("Express + TypeScript Server");
  });

  /**
   * Fetch all the challenges
   */
  app.get("/challenges", async (req: Request, res: Response) => {
    const challenges = await fetchChallenges();
    return res.json({ challenges });
  });

  /**
   * Fetch a user by their address
   */
  app.get("/user/:address", validateAddress, async (req: Request, res: Response) => {
    console.log("GET /user/:address \n", req.params);
    const address = req.params.address;
    try {
      const user = await fetchUser(address);
      return res.json({ user });
    } catch (e) {
      console.error(e);
      if (e instanceof Error) {
        return res.status(500).json({ error: e.message });
      } else {
        return res.status(500).json({ error: "Unexpected error occurred" });
      }
    }
  });

  /**
   * Create a new user
   */
  app.post("/user", validateNewUser, async (req: Request, res: Response) => {
    console.log("POST /user \n", req.body);
    const { address, ens } = req.body;
    try {
      // Create a new user
      const user = await createUser(address, ens);
      return res.json({ user });
    } catch (e) {
      console.error(e);
      if (e instanceof Error) {
        return res.status(500).json({ error: e.message });
      } else {
        return res.status(500).json({ error: "Unexpected error occurred" });
      }
    }
  });

  /**
   * Submit a deployed contract for a challenge
   */
  app.post(
    "/submit",
    validateChallengeSubmission,
    async function (req: Request, res: Response) {
      console.log("POST /submit \n", req.body);
      const { network, contractAddress, challengeName, userAddress } = req.body;
      try {
        // Verify that no other submission exists for that contract address
        const userWithExistingSubmission = await fetchUserWithChallengeAtAddress(contractAddress);
        if (userWithExistingSubmission) {
          const challengeStatus = userWithExistingSubmission.challenges.find(item => item.contractAddress === contractAddress);
          if (userWithExistingSubmission.address !== userAddress) {
            // Potentially malicious user trying to submit a challenge from/for another user
            return res.status(400).json({ error: "Submission already exists for this contract address" });
          } else {
            if (challengeStatus?.status === "pending") {
              // Calculate the time since the submission was made
              const currentTime = Date.now();
              const submissionTime = challengeStatus.timestamp;
              const timeDifference = currentTime - submissionTime.getTime();
              const timeDifferenceInSeconds = timeDifference / 1000;
              if (timeDifferenceInSeconds < 180) {
                // TODO: Need to notify the team that things are running slow or seized and causing issues
              }
            }
            return res.status(400).json({ error: `Challenge has already been submitted and has a ${challengeStatus?.status} state` });
          }
        }
        // Update the user's submission status to pending
        await updateUserChallengeSubmission(userAddress, challengeName, contractAddress, network, "pending");
        // Fetch the challenge metadata
        const challenge = await fetchChallenge(challengeName);
        const submissionConfig = { challenge, network, contractAddress };
        // Download the contract
        await downloadContract(submissionConfig);
        // Test the challenge submission
        const result = await testChallengeSubmission(submissionConfig);
        const parsedTestResults = parseTestResults(result);
        // Update the user's submission status to success or failed
        const status = parsedTestResults.passed ? "success" : "failed";
        const gasReport = parsedTestResults.gasReport;
        await updateUserChallengeSubmission(userAddress, challengeName, contractAddress, network, status, gasReport);
        return res.json({ result: parsedTestResults });
      } catch (e) {
        console.error(e);
        if (e instanceof Error) {
          return res.status(500).json({ error: e.message });
        } else {
          return res.status(500).json({ error: "Unexpected error occurred" });
        }
      }
    }
  );

  // Start server
  if (fs.existsSync("server.key") && fs.existsSync("server.cert")) {
    https
      .createServer(
        {
          key: fs.readFileSync("server.key"),
          cert: fs.readFileSync("server.cert"),
        },
        app
      )
      .listen(PORT, () => {
        console.log(`[server]: Server is running at http://localhost:${PORT}`);
      });
  } else {
    app.listen(PORT, () => {
      console.log(`[server]: Server is running at http://localhost:${PORT}`);
    });
  }
};
