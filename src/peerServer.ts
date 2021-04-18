import { createInstance, CustomExpress, IClient, IMessage } from "peer";
import type { Server as HttpServer } from "http";
import express from "express";
import type { Server as WebSocketServer } from "ws";

export default class PeerServer {
  public websocket: WebSocketServer | null = null;
  public readonly peerExpressApp: CustomExpress;
  private readonly httpServer: HttpServer;

  public constructor(httpServer: HttpServer) {
    this.httpServer = httpServer;
    this.peerExpressApp = express() as CustomExpress;
    this.peerExpressApp.on("mount", this.onMount);
    this.peerExpressApp.on("connection", this.onConnection);
    this.peerExpressApp.on("disconnect", this.onDisconnect);
    this.peerExpressApp.on("message", this.onMessage);
  }

  private onMount = (): void => {
    this.websocket = createInstance({
      app: this.peerExpressApp,
      server: this.httpServer,
      options: {
        expire_timeout: 5000,
        alive_timeout: 60000,
        key: "peerjs",
        path: "/",
        concurrent_limit: 5000,
        allow_discovery: false,
        proxied: false,
        cleanup_out_msgs: 1000,
        multiple_websockets: true,
      },
    });
  };

  private onConnection = (client: IClient): void => {
    console.log(`Peerjs client connected : ` + client.getId());
    //client.send('connected to client')
  };

  private onDisconnect = (client: IClient): void => {
    console.log(`Peerjs client disconnected : ` + client.getId());
  };

  private onMessage = (client: IClient, message: IMessage) => {
    if (message.type === "HEARTBEAT") {
      // console.log("Received heartbeat message from : " + client.getId())
      return;
    }

    console.log(
      `Received ${message} from ` + client.getId() + " : " + message.payload
    );
  };
}
