import * as dotenv from "dotenv";

import cors from "cors";
import { createServer } from "http";
import express from "express";
import { getPort } from "./utils";
import helmet from "helmet";
import initSockets from "./sockets";
import path from "path";
import startPeerServer from "./peerServer";

dotenv.config();

const PORT = getPort();

// Express
const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "client")));

  app.get("/*", (req, res) => {
    res.sendFile(path.join(__dirname, "client", "index.html"));
  });
}

// HTTP server
const httpServer = createServer(app);

// Sockets
initSockets(httpServer);

// Start peerjs server
startPeerServer();

// HTTP server listen
httpServer.listen(PORT, () => {
  console.log(`HTTP server listening on port ${PORT}`);
});
