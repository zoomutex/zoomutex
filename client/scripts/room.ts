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

  private readonly userStream: MediaStream;
  private peer: Peer | null = null;

  private constructor(roomId: string, userStream: MediaStream) {
    this.roomId = roomId;
    this.userStream = userStream;
    // @ts-ignore
    this.peer = new Peer({
      host: window.location.hostname,
      path: "/peerjs",
      port: window.location.hostname === "localhost" ? 7000 : 443,
    });
    this.peer.on("open", this.onOpen);
    this.peer.on("call", this.onPeerCall);
    this.peer.on("disconnected", this.onPeerDisconnected);
  }

  private onOpen = async (): Promise<void> => {
    console.log(`userId: ${this.peer?.id}`);
    const body = JSON.stringify({ userId: this.peer?.id });

    const res = await fetch(`/${this.roomId}/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body,
    });

    const data = await res.json();
    this.callPeers(data);
  };

  private callPeers = (peers: string[]): void => {
    if (this.peer === null) {
      throw new Error("peer was unexpectedly null");
    }

    for (const peerId of peers) {
      const call = this.peer.call(peerId, this.userStream);
      console.log(`called ${peerId}`);
      call.on("stream", this.onCallStream(peerId));
      call.on("close", this.onCallClose(peerId));
      call.on("error", this.onCallError(peerId));
    }
  };

  private onPeerCall = (call: Peer.MediaConnection): void => {
    console.log(`answering call from ${call.peer}`);
    call.answer(this.userStream);
    call.on("stream", this.onCallStream(call.peer));
  };

  private onPeerDisconnected = (): void => {
    console.log(`disconnected from server`);
  };

  private onCallStream = (peerId: string) => (stream: MediaStream): void => {
    console.log(`received stream from ${peerId}`);
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
