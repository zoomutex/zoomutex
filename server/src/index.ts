import * as dotenv from "dotenv";

import cors from "cors";
import { createServer } from "http";
import express from "express";
import helmet from "helmet";
import initSockets from "./sockets";
import path from "path";

dotenv.config();

if (!process.env.PORT) {
  process.exit(1);
}

const PORT: number = parseInt(process.env.PORT);

// Express
const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

const parent = (p: string): string => {
  return path.dirname(p);
};

if (process.env.NODE_ENV === "production") {
  const clientPath = parent(parent(__dirname));
  const buildPath = path.join(clientPath, "client", "build");
  const indexPath = path.join(buildPath, "index.html");

  app.use(express.static(buildPath));

  app.get("/*", (req, res) => {
    res.sendFile(indexPath);
  });
}

// HTTP server
const httpServer = createServer(app);

// Sockets
initSockets(httpServer);

// HTTP server listen
httpServer.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
