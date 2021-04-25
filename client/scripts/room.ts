import type Peer from "peerjs";

const getUserMediaStream = async () =>
  await navigator.mediaDevices.getUserMedia({ audio: true, video: true });

/**
 * Redirect to the application root.
 */
function redirect(): void {
  window.location.replace("/");
}

/**
 * Get the room id from the URL.
 * @returns The room ID.
 */
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
  private readonly peer: Peer | null = null;
  private readonly videosRef: HTMLVideoElement;
  private readonly userStreams = new Set<string>();

  private constructor(roomId: string, userStream: MediaStream) {
    this.roomId = roomId;
    this.userStream = userStream;

    // Get the reference to `#videos`
    const videosRef = document.getElementById("videos");
    if (videosRef === null) {
      throw new Error("videos element was unexpectedly null");
    }
    this.videosRef = videosRef as HTMLVideoElement;

    // Add the user's own media stream to the DOM
    this.addMediaStreamToDOM(userStream, true);

    // The following ts-ignore is necessary because we are importing from a CDN,
    // not from npm.
    // @ts-ignore
    this.peer = new Peer({
      host: window.location.hostname,
      path: "/peerjs",
      port: window.location.hostname === "localhost" ? 7000 : 443,
    });
    this.peer.on("open", this.onPeerOpen);
    this.peer.on("call", this.onPeerCall);
    this.peer.on("disconnected", this.onPeerDisconnected);
  }

  /**
   * Event handler for when peerjs has opened a connection successfully.
   * Now that peerjs has initialised, we know our peerId. Thus, we can get
   * the ids for the peers currently in the room (or create the room if it does
   * not exist - as the client, we don't really care).
   */
  private onPeerOpen = async (): Promise<void> => {
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

  /**
   * Call all the peers in the room currently.
   * @param peers The ids of all the peers in the room currently.
   */
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

  /**
   * Event handler for when we receive a call.
   * @param call The media connection we are receiving.
   */
  private onPeerCall = (call: Peer.MediaConnection): void => {
    console.log(`answering call from ${call.peer}`);
    call.answer(this.userStream);
    call.on("stream", this.onCallStream(call.peer));
  };

  /**
   * Event handler for when a peer disconnected.
   */
  private onPeerDisconnected = (): void => {
    console.log(`disconnected from server`);
    // TODO: clean up
  };

  /**
   * Event handler for when we receive the media stream from a call.
   *
   * This function is constructed in this way so we can log the `peerId`.
   */
  private onCallStream = (peerId: string) => (stream: MediaStream): void => {
    if (this.userStreams.has(peerId)) {
      console.log(`ignored superfluous stream from ${peerId}`);
      return;
    }

    console.log(`received stream from ${peerId}`);
    this.userStreams.add(peerId);
    this.addMediaStreamToDOM(stream);
  };

  /**
   * Event handler for when we close a call.
   *
   * This function is constructed in this way so we can log the `peerId`.
   */
  private onCallClose = (peerId: string) => (): void => {
    console.error(`peerId ${peerId} has disconnected from the call`);
    // TODO: clean up
  };

  /**
   * Event handler for when a call has an error.
   *
   * This function is constructed in this way so we can log the `peerId`.
   */
  private onCallError = (peerId: string) => (err: any): void => {
    console.error(`peerId ${peerId} has had an error: ${err}`);
    // TODO: clean up
  };

  /**
   * Adds the media stream to the DOM as a video element.
   *
   * @param stream The media stream to include for the video.
   * @param isUser `true` when the media stream is for the user's own camera.
   */
  private addMediaStreamToDOM = (
    stream: MediaStream,
    isUser: boolean = false
  ): void => {
    const videoEl = document.createElement("video");
    if (isUser) {
      videoEl.id = "user";
    }

    videoEl.srcObject = stream;
    videoEl.autoplay = true;
    videoEl.playsInline = true;

    this.videosRef.appendChild(videoEl);
  };

  /**
   * Creates/access the `Room` singleton.
   *
   * @returns
   */
  public static init = async (): Promise<Room> => {
    const roomId = getRoomId();
    const userStream = await getUserMediaStream();
    return new Room(roomId, userStream);
  };
}

Room.init();
