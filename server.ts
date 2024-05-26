import express, { Express, Request, Response, json } from "express";
import https from "https";
import fs from "fs";
import cors from "cors";
import dotenv from "dotenv";
import { fetchChallenges } from "./utils/helpers";

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
  app.get("/:challengeId/:network/:address", async function (req, res) {
    console.log("GET /:challengeId/:network/:address \n", req.params);
    const { challengeId, network, address } = req.params;
    const challenges = await fetchChallenges();
    const challenge = challenges[challengeId as keyof typeof challenges];

    // 1. Execute logic to download and test the submitted contract

    // 2. If the test passes, save the test results to a database

    // 3. Return some response to the client

    return res.json({
      network,
      address,
      challenge,
    });
  });

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
