import http from "http";
import WebSocket from "ws";
import { v4 as uuidv4 } from "uuid";
import { ErrorMessage, JoinRoomMessage, Message, MessageType } from "./types";

interface SocketData {
  userId: string;
  roomId: string;
}

export default class WebSocketServer {
  private readonly server: WebSocket.Server;
  private readonly rooms: Map<string, Set<WebSocket>> = new Map();
  private readonly roomWeakMap: WeakMap<WebSocket, SocketData> = new WeakMap();

  public constructor(httpServer: http.Server) {
    this.server = new WebSocket.Server({ server: httpServer, path: "/socket" });
    this.server.on("connection", this.onConnection);
    this.server.on("close", this.onDisconnected);
    this.server.on("error", this.onError);
  }
  private onConnection = (ws: WebSocket): void => {
    console.log("new ws connection");
    ws.on("message", this.onMessage(ws));
  };

  private onDisconnected = (ws: WebSocket): void => {
    const socketData = this.roomWeakMap.get(ws);
    if (!socketData) {
      return;
    }

    const room = this.rooms.get(socketData.roomId);
    if (!room) {
      return;
    }

    // Tell the room that their peer has disconnected
    this.broadcast(room, {
      type: "peer-disconnected",
      payload: socketData.userId,
    });
  };

  private onError = (error: string): void => {
    console.log(error);
  };

  private onMessage = (ws: WebSocket) => (message: string): void => {
    console.log(`received ws ${message}`);
    let data: Message;

    // Get the JSON data
    try {
      data = JSON.parse(message);
    } catch (error) {
      this.sendError(ws, "invalid JSON");
      return;
    }

    // Handle the data.type
    switch (data.type) {
      // @ts-ignore
      case "HEARTBEAT":
        break;
      case "join-room":
        this.onJoinRoom(ws, data);
        break;
      case "error":
        this.onReceivedError(data);
        break;
      default:
        this.sendError(ws, "invalid type");
        break;
    }
  };

  private onJoinRoom = (ws: WebSocket, data: JoinRoomMessage): void => {
    const roomId = data?.payload;

    if (typeof roomId !== "string" || roomId.length === 0) {
      this.sendError(ws, "invalid roomId");
      return;
    }

    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }

    const room = this.rooms.get(roomId)!;
    room.add(ws);

    const userId = uuidv4();
    this.roomWeakMap.set(ws, { userId, roomId });

    this.sendMessage(ws, { type: "user-id", payload: userId });
    this.broadcast(room, { type: "peer-connected", payload: userId }, userId);

    // Notify the newly connected user of their peers
    const peers: string[] = [];
    for (const sock of room) {
      const data = this.roomWeakMap.get(sock);
      if (data?.userId && data.userId !== userId) {
        peers.push(data.userId);
      }
    }

    this.sendMessage(ws, { type: "populate-room", payload: peers });
  };

  private onReceivedError = (data: ErrorMessage): void => {
    console.error(data.payload);
  };

  private sendMessage = (ws: WebSocket, msg: Message): void => {
    ws.send(JSON.stringify(msg));
  };

  private sendError = (ws: WebSocket, msg: string): void => {
    this.sendMessage(ws, { type: "error", payload: msg });
  };

  private broadcast = (
    room: Set<WebSocket>,
    msg: Message,
    omitPeerId?: string
  ): void => {
    for (const peer of room) {
      const peerData = this.roomWeakMap.get(peer);

      if (peerData?.userId !== omitPeerId) {
        this.sendMessage(peer, msg);
      }
    }
  };
}
