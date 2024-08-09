import express, { Express, Request, Response, json } from "express";
import https from "https";
import fs from "fs";
import cors from "cors";
import {
  validateChallengeSubmission,
  downloadContract,
  testChallengeSubmission,
  PORT,
  validateAddress
} from "./utils";
import { fetchChallenge, fetchChallenges } from "./services/challenge";
import { fetchUser } from "./services/user";
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
   * Submit a deployed contract for a challenge
   */
  app.post(
    "/submit",
    validateChallengeSubmission,
    async function (req: Request, res: Response) {
      console.log("POST /submit \n", req.body);
      const { network, contractAddress, challengeSlug, userAddress } = req.body;
      try {
        // Verify that no other submission exists for that contract address
        // TODO
        // Update the user's submission status to pending
        // TODO
        const challenge = await fetchChallenge(challengeSlug);
        const submissionConfig = { challenge, network, contractAddress };
        await downloadContract(submissionConfig);
        const result = await testChallengeSubmission(submissionConfig);
        const parsedTestResults = parseTestResults(result);
        // Update the user's submission status to complete or failed
        // TODO
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
