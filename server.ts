import express, { Express, Request, Response, json } from "express";
import https from "https";
import fs from "fs";
import cors from "cors";
import dotenv from "dotenv";

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
}
