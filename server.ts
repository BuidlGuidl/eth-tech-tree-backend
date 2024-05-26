import express, { Express, Request, Response, json } from "express";
import https from "https";
import fs from "fs";
import cors from "cors";
import dotenv from "dotenv";
import { downloadContract, fetchChallenge, validateSubmission } from "./utils";

dotenv.config();

const port = process.env.PORT || 3000;

export const startServer = async () => {
  const app: Express = express();
  app.use(cors());
  app.use(json());

  // Define routes
  app.get("/", (req: Request, res: Response) => {
    res.send("Express + TypeScript Server");
  });

  /**
   * The challenge submission route
   * Temp setup as a GET to save us effort of firing POST requests during development
   */
  app.get(
    "/:challengeId/:network/:address",
    validateSubmission,
    async function (req: Request, res: Response) {
      console.log("GET /:challengeId/:network/:address \n", req.params);
      const { network, address } = req.params;
      const challengeId = +req.params.challengeId; // convert to number
      try {
        // 1. Fetch challenge metadata using the challengeId
        const challenge = await fetchChallenge(challengeId);
        // 2. Download the source code for the contract from etherescan
        const isSuccess = await downloadContract({
          challenge,
          network,
          address,
        });
        if (!isSuccess) {
          return res.status(400).json({
            message: "Failed to download the contract from Etherscan",
          });
        }
        // 3. Run the test from challenge repo against the downloaded contract
        // 4. If the test passes, save the test results to a database
        // 5. Return some response to the client
        return res.json({
          network,
          address,
        });
      } catch (e) {
        console.error(e);
        return res.status(500).json({
          error: "An unexpected error occurred",
        });
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
