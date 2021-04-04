import Peer from "peerjs";
import React from "react";

const SERVER_PEER_PORT = 9000;
const SERVER_URL = 'localhost'
const PEER_ENDPOINt = '/peerServer'

export const peer = new Peer("", {
  //  debug: 2,
    host: SERVER_URL,
    port: SERVER_PEER_PORT,
    path: PEER_ENDPOINt
});

export const PeerContext = React.createContext(peer);
