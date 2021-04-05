import Peer from "peerjs";
import React from "react";
import { getPort } from "../utils";

const PORT = getPort();
const URL = process.env.NODE_ENV === "production" ? "/" : "http://localhost";
const ENDPOINT = "/peerServer";

export const peer = new Peer("", {
  //  debug: 2,
  host: URL,
  port: PORT,
  path: ENDPOINT,
});

export const PeerContext = React.createContext(peer);
