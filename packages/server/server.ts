import express, { Express, Request, Response, json } from "express";
import https from "https";
import fs from "fs";
import cors from "cors";
import {
  validateSubmission,
  fetchChallenge,
  downloadContract,
  testChallengeSubmission,
} from "./utils";
import { PORT } from "./utils";

const port = PORT;

export const startServer = async () => {
  const app: Express = express();
  app.use(cors());
  app.use(json());

  // Define routes
  app.get("/", (req: Request, res: Response) => {
    res.send("Express + TypeScript Server");
  });

  /**
   * Challenge submission route temp setup as a GET to save us effort of firing POST requests during development
   * 1. Fetch the contract source code from Etherscan and save it into challenge repo
   * 2. Run the test from within the challenge repo against the downloaded contract
   * 3. Return the results
   */
  app.get(
    "/:challengeId/:network/:address",
    validateSubmission,
    async function (req: Request, res: Response) {
      console.log("GET /:challengeId/:network/:address \n", req.params);
      const { network, address } = req.params;
      const challengeId = +req.params.challengeId; // convert to number
      try {
        const challenge = await fetchChallenge(challengeId);
        const submissionConfig = { challenge, network, address };
        await downloadContract(submissionConfig);
        const result = await testChallengeSubmission(submissionConfig);
        return res.json({ result });
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
      .listen(port, () => {
        console.log(`[server]: Server is running at http://localhost:${port}`);
      });
  } else {
    app.listen(port, () => {
      console.log(`[server]: Server is running at http://localhost:${port}`);
    });
  }
};
