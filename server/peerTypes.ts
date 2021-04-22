/**
 * Contains types which peer does not expose (annoyingly).
 */

import type { EventEmitter } from "events";
import type { ExpressPeerServer } from "peer";
import type WebSocketLib from "ws";

enum MessageType {
  OPEN = "OPEN",
  LEAVE = "LEAVE",
  CANDIDATE = "CANDIDATE",
  OFFER = "OFFER",
  ANSWER = "ANSWER",
  EXPIRE = "EXPIRE",
  HEARTBEAT = "HEARTBEAT",
  ID_TAKEN = "ID-TAKEN",
  ERROR = "ERROR",
}

export interface IMessage {
  readonly type: MessageType;
  readonly src: string;
  readonly dst: string;
  readonly payload?: any;
}

type MyWebSocket = WebSocketLib & EventEmitter;

export interface IClient {
  getId(): string;
  getToken(): string;
  getSocket(): MyWebSocket | null;
  setSocket(socket: MyWebSocket | null): void;
  getLastPing(): number;
  setLastPing(lastPing: number): void;
  send(data: any): void;
}

export type PeerServer = ReturnType<typeof ExpressPeerServer>;
