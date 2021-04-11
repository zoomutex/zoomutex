import Peer from "peerjs";
import React from "react";

const URL = process.env.NODE_ENV === "production" ? "/" : "localhost";
const ENDPOINT = "/peerServer";

export const peer = new Peer("", {
  //  debug: 2,
  host: URL,
  port: 9000,
  path: ENDPOINT,
});

export const PeerContext = React.createContext(peer);
