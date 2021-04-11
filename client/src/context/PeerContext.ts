import Peer from "peerjs";
import React from "react";

const PORT = process.env.NODE_ENV === "production" ? 443 : 7000;

export const peer = new Peer("", {
  host: window.location.hostname,
  path: "/peerjs",
  port: PORT,
});

export const PeerContext = React.createContext(peer);
