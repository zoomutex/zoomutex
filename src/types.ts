export interface ErrorMessage {
  type: "error";
  payload: string;
}

export interface JoinRoomMessage {
  type: "join-room";
  payload: string;
}

export interface PeerConnectedMessage {
  type: "peer-connected";
  payload: string;
}

export interface PeerDisconnectedMessage {
  type: "peer-disconnected";
  payload: string;
}

export interface PopulateRoomMessage {
  type: "populate-room";
  payload: string[];
}

export interface UserIdMessage {
  type: "user-id";
  payload: string;
}

export type Message =
  | ErrorMessage
  | JoinRoomMessage
  | PeerConnectedMessage
  | PeerDisconnectedMessage
  | PopulateRoomMessage
  | UserIdMessage;

export type MessageType = Message["type"];
