import type {
  ErrorMessage,
  Message,
  MessageType,
  PeerConnectedMessage,
  PeerDisconnectedMessage,
  PopulateRoomMessage,
  UserIdMessage,
} from "../../types";
import type Peer from "peerjs";

const getUserMediaStream = async () =>
  await navigator.mediaDevices.getUserMedia({ audio: true, video: true });

function redirect(): void {
  window.location.replace("/");
}

function getRoomId(): string {
  const path = window.location.pathname.split("/");
  const room = path[1];

  if (room === undefined || room === "") {
    redirect();
    throw new Error("Undefined room - redirecting now");
  }

  return room;
}

class Room {
  private readonly roomId: string;
  private userId: string | null = null;

  private readonly socket: WebSocket;
  private socketPeerIds = new Set<string>();

  private readonly userStream: MediaStream;
  private peer: Peer | null = null;

  private constructor(roomId: string, userStream: MediaStream) {
    this.roomId = roomId;
    this.userStream = userStream;

    this.socket = new WebSocket(`ws://${window.location.host}/socket`);
    this.socket.onopen = this.onSocketOpen;
    this.socket.onclose = this.onSocketClose;
    this.socket.onmessage = this.onSocketMessage;
  }

  private onSocketOpen = (): void => {
    this.sendSocketMessage("join-room", this.roomId);
  };

  private onSocketClose = (): void => {
    // TODO
  };

  private onSocketMessage = (event: MessageEvent): void => {
    console.log(`received ${event.data}`);
    let data: Message;

    // Get the JSON data
    try {
      data = JSON.parse(event.data);
    } catch (error) {
      this.sendSocketError("invalid JSON");
      return;
    }

    // Handle the data.type
    switch (data.type) {
      case "user-id":
        this.onReceiveUserId(data);
        break;
      case "peer-connected":
        this.onSocketPeerConnected(data);
        break;
      case "peer-disconnected":
        this.onSocketPeerDisconnected(data);
        break;
      case "error":
        this.onSocketReceiveError(data);
        break;
      case "populate-room":
        this.onSocketPopulateRoom(data);
        break;
      default: {
        console.log(`invalid type ${data.type}`);
        this.sendSocketError("invalid type");
        break;
      }
    }
  };

  private onReceiveUserId = (data: UserIdMessage): void => {
    if (
      data.type !== "user-id" ||
      data.payload === "" ||
      data.payload === undefined
    ) {
      return;
    }

    this.userId = data.payload;
    // @ts-ignore
    this.peer = new Peer(this.userId, {
      host: window.location.hostname,
      path: "/peerjs",
      port: window.location.hostname === "localhost" ? 7000 : 443,
    });
    this.peer.on("call", this.onPeerCall);
  };

  private onSocketPeerConnected = (data: PeerConnectedMessage): void => {
    const peerId = data.payload;
    if (!peerId) {
      console.error(`invalid peerId ${peerId}`);
      return;
    }

    this.socketPeerIds.add(peerId);
  };

  private onSocketPeerDisconnected = (data: PeerDisconnectedMessage): void => {
    console.log(`peer ${data.payload} has left`);
  };

  private onSocketReceiveError = (data: ErrorMessage): void => {
    console.error(`Received error: ${data.payload}`);
  };

  private onSocketPopulateRoom = (data: PopulateRoomMessage): void => {
    this.socketPeerIds = new Set(data.payload);

    if (this.peer === null) {
      console.error(`could not call peers as peerId was null`);
      return;
    }

    for (const peerId of this.socketPeerIds) {
      const call = this.peer.call(peerId, this.userStream);
      console.log(`called ${peerId}`);
      call.on("stream", this.onCallStream(peerId));
      call.on("close", this.onCallClose(peerId));
      call.on("error", this.onCallError(peerId));
    }
  };

  private sendSocketMessage = (type: MessageType, payload: string): void => {
    const data = JSON.stringify({ type, payload });
    console.log(`sending ${data}`);
    this.socket.send(data);
  };

  private sendSocketError = (msg: string): void => {
    this.sendSocketMessage("error", msg);
  };

  private onPeerCall = (call: Peer.MediaConnection): void => {
    console.log(`answering call from ${call.peer}`);
    call.answer(this.userStream);
    call.on("stream", this.onCallStream(call.peer));
  };

  private onCallStream = (peerId: string) => (stream: MediaStream): void => {
    console.log("received call");
  };

  private onCallClose = (peerId: string) => (): void => {
    console.error(`peerId ${peerId} has disconnected from the call`);
  };

  private onCallError = (peerId: string) => (err: any): void => {
    console.error(`peerId ${peerId} has had an error: ${err}`);
  };

  // TODO: cleanup media streams

  public static init = async (): Promise<Room> => {
    const roomId = getRoomId();
    const userStream = await getUserMediaStream();
    return new Room(roomId, userStream);
  };
}

Room.init();
