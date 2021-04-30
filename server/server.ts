import * as dotenv from "dotenv";

import PeerWrapper from "./peerWrapper";
import Rooms from "./rooms";
import express from "express";
import { getEnvOrDefaultPort } from "./utils";
import http from "http";
import path from "path";

dotenv.config();

const PORT = getEnvOrDefaultPort();
const CLIENT_PATH = path.join(__dirname, "../client");

const app = express();
const httpServer = http.createServer(app);

const rooms = Rooms.init();
const peerServer = PeerWrapper.init(httpServer, rooms);

app.use("/peerjs", peerServer.peerExpressApp);
app.use(express.json());
app.use(express.static(CLIENT_PATH));
app.use(express.static(path.join(__dirname,CLIENT_PATH + "/style")))

app.get("/", async (_req, res) => {
  return res.sendFile(path.join(CLIENT_PATH, "join.html"));
});

app.post("/:room/users", (req, res) => {
  const roomId = req.params.room;
  const userId = req.body?.userId;

  if (roomId === undefined || roomId.length === 0) {
    return res.json({ error: "invalid room" });
  } else if (userId === undefined || !userId) {
    console.log(req);
    return res.json({ error: "invalid userId" });
  }

  return res.json(rooms.getRoomPeers(roomId, userId));
});

app.get("/:room/", async (_req, res) => {
  return res.sendFile(path.join(CLIENT_PATH, "room.html"));
});

// redirect all invalid reqs to /
app.get("*", async (_req, res) => {
  return res.redirect("/");
});

httpServer.listen(PORT, () => {
  console.log(`HTTP server listening on port ${PORT}`);
});
