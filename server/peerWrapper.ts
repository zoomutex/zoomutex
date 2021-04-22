import { IClient, PeerServer } from "./peerTypes";

import { ExpressPeerServer } from "peer";
import type { Server as HttpServer } from "http";
import Rooms from "./rooms";
import { v4 as uuidv4 } from "uuid";

export default class PeerWrapper {
  private static instance: PeerWrapper | null = null;

  public static init = (httpServer: HttpServer, rooms: Rooms): PeerWrapper => {
    if (PeerWrapper.instance === null) {
      PeerWrapper.instance = new PeerWrapper(httpServer, rooms);
    }

    return PeerWrapper.instance;
  };

  public readonly peerExpressApp: PeerServer;
  private readonly rooms: Rooms;

  private constructor(httpServer: HttpServer, rooms: Rooms) {
    this.rooms = rooms;

    this.peerExpressApp = ExpressPeerServer(httpServer, {
      path: "/",
      generateClientId: uuidv4,
    });
    this.peerExpressApp.on("connection", this.onConnection);
    this.peerExpressApp.on("disconnect", this.onDisconnect);
  }

  private onConnection = (client: IClient): void => {
    console.log(`Peerjs client connected : ` + client.getId());
  };

  private onDisconnect = (client: IClient): void => {
    console.log(`Peerjs client disconnected : ` + client.getId());
    this.rooms.onPeerDisconnect(client.getId());
  };
}
