import express, { Express, Request, Response, json } from "express";
import https from "https";
import fs from "fs";
import cors from "cors";
import {
  validateChallengeSubmission,
  downloadContract,
  testChallengeSubmission,
  PORT,
  validateIdentifier,
  validateNewUser,
  SERVER_CERT,
  SERVER_KEY,
  SKIP_TEST_EXISTS_CHECK,
  trackPlausibleEvent,
  SUPPORTED_CHAINS,
} from "./utils";
import { fetchChallenge, fetchChallenges } from "./services/challenge";
import { getEnsAddress } from "./services/ens";
import { fetchUserWithChallengeAtAddress, fetchUser, createUser, updateUserChallengeSubmission, fetchAllUsers } from "./services/user";
import { parseTestResults } from "./utils/parseTestResults";
import { getLeaderboard } from "./services/leaderboard";
import { createAuthMessage } from "./utils/auth";
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
   * Fetch all supported testnets
   */
  app.get("/testnets", async (_req: Request, res: Response) => {
    return res.json({ testnets: SUPPORTED_CHAINS });
  });

  /**
   * Fetch a user by their address
   */
  app.get("/user/:identifier", validateIdentifier, async (req: Request, res: Response) => {
    console.log("GET /user/:identifier \n", req.params);
    const identifier = req.params.identifier;
    try {
      const user = await fetchUser(identifier);
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
    const { address, ens, device, location } = req.body;
    try {
      // Create a new user
      const { isNew, user } = await createUser(address, ens, device, location);
      if (isNew) {
        // Track the new user event
        trackPlausibleEvent("NewUser", {}, req);
      }
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
      const { contractAddress, challengeName, userAddress } = req.body;
      try {
        // Verify that no other submission exists for that contract address
        if (!SKIP_TEST_EXISTS_CHECK) {
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
                  console.log(`Challenge is taking awhile to move out of pending state. It has been ${timeDifferenceInSeconds} seconds since the submission was made.`)
                  // TODO: Need to notify the team that things are running slow or seized and causing issues
                }
              } else if (challengeStatus?.status === "success") {
                // If this specific contract has already been run by someone and succeeded, we don't need to run the tests again
                return res.status(400).json({ error: `Challenge has already been submitted and has a ${challengeStatus?.status} state` });
              }
            }
          }
        }
        // Fetch the challenge metadata
        const challenge = await fetchChallenge(challengeName);
        const submissionConfig = { challenge, contractAddress };
        // Download the contract
        const { network } = await downloadContract(submissionConfig);
        trackPlausibleEvent("ChallengeSubmission", { network, challengeName }, req);
        // Update the user's submission status to pending now that we know the network
        await updateUserChallengeSubmission(userAddress, challengeName, contractAddress, network, "pending");
        // Test the challenge submission
        const { stdout, stderr } = await testChallengeSubmission(submissionConfig);
        if (stderr && !stderr.includes("Debugger attached.\nDebugger attached.\n")) {
          console.error(stderr);
          throw new Error("Error running tests: " + stderr);
        }
        const parsedTestResults = parseTestResults(submissionConfig, stdout);
        // Update the user's submission status to success or failed
        const status = parsedTestResults.passed ? "success" : "failed";
        const gasReport = parsedTestResults.gasReport;
        const error = parsedTestResults.error;
        await updateUserChallengeSubmission(userAddress, challengeName, contractAddress, network, status, gasReport, error);
        return res.json({ result: parsedTestResults });
      } catch (e) {
        console.error(e);
        if (e instanceof Error) {
          return res.status(500).json({ error: e.message });
        } else {
          return res.status(500).json({ error: "Unexpected error occurred:" + e });
        }
      }
    }
  );

  /**
   * Fetch all users
   */
  app.get("/users", async (req: Request, res: Response) => {
    console.log("GET /users");
    try {
      const users = await fetchAllUsers();
      return res.json({ users });
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
   * Fetch the leaderboard data
   */
  app.get("/leaderboard", async (req: Request, res: Response) => {
    try {
      const leaderboard = await getLeaderboard();
      return res.json({ leaderboard });
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
   * Resolve an ENS name to an address
   */
  app.get("/ens/:name", async (req: Request, res: Response) => {
    console.log("GET /ens/:name \n", req.params);
    const ensName = req.params.name;
    try {
      const address = await getEnsAddress(ensName);
      return res.json({ address });
    } catch (e) {
      console.error(e);
      if (e instanceof Error) {
        return res.status(500).json({ error: e.message });
      } else {
        return res.status(500).json({ error: "Unexpected error occurred" });
      }
    }
  });

  app.get("/message/:userAddress", async (req: Request, res: Response) => {
    console.log("GET /message/:userAddress \n", req.params);
    const { userAddress } = req.params;
    try {
      const user = await fetchUser(userAddress);
      if (!user || !user.address) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const currentNonce = user.nonce || 1;
      const authMessage = createAuthMessage(currentNonce);
      return res.json({ message: authMessage });
    } catch (e) {
      console.error(e);
      if (e instanceof Error) {
        return res.status(500).json({ error: e.message });
      } else {
        return res.status(500).json({ error: "Unexpected error occurred" });
      }
    }
  });

  if (SKIP_TEST_EXISTS_CHECK) {
    console.log("WARN: Set up to skip the test exists check");
  }
  // Start server
  if (fs.existsSync(SERVER_KEY) && fs.existsSync(SERVER_CERT)) {
    console.log("Starting server with HTTPS");
    https
      .createServer(
        {
          key: fs.readFileSync(SERVER_KEY),
          cert: fs.readFileSync(SERVER_CERT),
        },
        app
      )
      .listen(PORT, () => {
        console.log(`[server]: Server is running at https://localhost:${PORT}`);
      });
  } else {
    app.listen(PORT, () => {
      console.log(`[server]: Server is running at http://localhost:${PORT}`);
    });
  }
};
