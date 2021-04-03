import Peer from "peerjs";
import React from "react";

export const peer = new Peer();
export const PeerContext = React.createContext(peer);
