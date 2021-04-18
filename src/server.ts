import * as dotenv from "dotenv";

import express from "express"
import { getPort } from "./utils";
import path from "path";
import startPeerServer from "./peerServer";
import WebSocketServer from "./webSocketServer";
import http from "http"
dotenv.config();

const PORT = getPort();

const app = express()
const httpServer = http.createServer(app)

app.use(express.static(path.join(__dirname, "client")))

app.get("/", async (req, res) => {
  return res.sendFile(path.join(__dirname, "client", "join.html"));
});

app.get("/room/:room", async (req, res) => {
  return res.sendFile(path.join(__dirname, "client", "room.html"));
});

new WebSocketServer(httpServer);
app.use("/peerjs", startPeerServer(httpServer))

// redirect all invalid reqs to /
app.get("*", async (req, res) => {
  return res.redirect("/");
});

httpServer.listen(PORT, () => {
  console.log(`HTTP server listening on port ${PORT}`);
});
