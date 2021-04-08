import * as dotenv from "dotenv";

import cors from "cors";
import { createServer } from "http";
import express from "express";
import helmet from "helmet";
import initSockets from "./sockets";
import path from "path";

import startPeerServer from '../components/peerServer'

dotenv.config();

const getPort = (): number => {
  const port = parseInt(process.env.PORT!);

  if (!!port && port !== NaN) {
    return port;
  }

  // Default production
  if (process.env.NODE_ENV === "production") {
    return 443;
  }

  // Development default
  return 7000;
};

const PORT = getPort();

// Express
const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

//if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "build")));

  app.get("/*", (req, res) => {
    res.sendFile(path.join(__dirname, "build", "index.html"));
  });
//}

// HTTP server
const httpServer = createServer(app);

// Sockets
initSockets(httpServer);

// Start peerjs server
startPeerServer()

// HTTP server listen
httpServer.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
