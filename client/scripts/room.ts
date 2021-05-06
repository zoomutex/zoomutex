import type Peer from "peerjs";
import type hark from "hark";
import { getRoomId, getUserMediaStream } from "./utils.js";

class Room {
  private static instance: Room | null = null;

  private readonly roomId: string;
  private readonly userStream: MediaStream;
  private readonly audioTrack: MediaStreamTrack;
  private readonly speechEvents: hark.Harker;
  private readonly peer: Peer | null = null;
  private readonly videosRef: HTMLVideoElement;
  private readonly userStreams = new Set<string>();
  private readonly domVideos = new Map<string, HTMLVideoElement>();
  private readonly dataConnections = new Map<string, Peer.DataConnection>();
  private isSpeaking = false

  private constructor(roomId: string, userStream: MediaStream) {
    this.roomId = roomId;
    this.userStream = userStream;

    const tracks = userStream.getAudioTracks();
    if (tracks.length < 0) {
      throw new Error("Could not acquire audio track");
    }
    this.audioTrack = tracks[0];

    // The following ts-ignore is necessary because we are importing from a CDN,
    // not from npm.
    // @ts-ignore
    this.speechEvents = hark(this.userStream, {});
    this.speechEvents.on("speaking", this.onSpeaking);
    this.speechEvents.on("stopped_speaking", this.onStoppedSpeaking);

    //  button to simulate a fake speaking event
    let fakeSpeechButton = document.getElementById("fakeSpeech");
    if (fakeSpeechButton === null){
      throw new Error("Button element was unexpectedly null");
    }
    fakeSpeechButton = fakeSpeechButton as HTMLButtonElement;
    fakeSpeechButton.onclick = this.flipSpeaking
    
    // Get the reference to `#videos`
    const videosRef = document.getElementById("videos");
    if (videosRef === null) {
      throw new Error("videos element was unexpectedly null");
    }
    this.videosRef = videosRef as HTMLVideoElement;

    // Add the user's own media stream to the DOM
    this.addMediaStreamToDOM(userStream);

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
    this.peer.on("connection", this.onPeerDataConnection);
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
    this.connectToDataPeers(data);
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
    this.addMediaStreamToDOM(stream, peerId);
  };

  /**
   * Event handler for when we close a call.
   *
   * This function is constructed in this way so we can log the `peerId`.
   */
  private onCallClose = (peerId: string) => (): void => {
    console.error(`call ${peerId} has disconnected from the call`);
    // TODO: clean up
  };

  /**
   * Event handler for when a call has an error.
   *
   * This function is constructed in this way so we can log the `peerId`.
   */
  private onCallError = (peerId: string) => (err: any): void => {
    console.error(`call ${peerId} has had an error: ${err}`);
    // TODO: clean up
  };

  private onPeerDataConnection = (conn: Peer.DataConnection): void => {
    const peerId = conn.peer;
    console.log(`received data connection from ${peerId}`);
    this.dataConnections.set(peerId, conn);

    // When we receive a data connection, we need to register the event handlers.
    conn.on("open", this.onPeerDataOpen(peerId, conn));
    conn.on("data", this.onPeerDataReceive(peerId));
    conn.on("error", this.onPeerDataError(peerId));
    conn.on("close", this.onPeerDataClose(peerId));
  };

  private connectToDataPeers = (peers: string[]): void => {
    if (this.peer === null) {
      throw new Error("peer was unexpectedly null");
    }

    for (const peerId of peers) {
      // Connect to the peer
      const conn = this.peer.connect(peerId);
      console.log(`connected to ${peerId}`);

      // Register the event handlers for the peer data connection
      conn.on("open", this.onPeerDataOpen(peerId, conn));
      conn.on("error", this.onPeerDataError(peerId));
      conn.on("close", this.onPeerDataClose(peerId));
      conn.on("data", this.onPeerDataReceive(peerId));
    }
  };

  private onPeerDataReceive = (peerId: string) => (data: any): void => {
    console.log(`received data '${data}' from ${peerId}`);
  };

  private onPeerDataOpen = (
    peerId: string,
    conn: Peer.DataConnection
  ) => (): void => {
    this.dataConnections.set(peerId, conn);
    this.sendPeerData(peerId, "hello world!");
  };

  private onPeerDataError = (peerId: string) => (err: any): void => {
    console.error(`data ${peerId} has had an error: ${err}`);
    // TODO: clean up
  };

  private onPeerDataClose = (peerId: string) => (): void => {
    console.warn(`data ${peerId} has closed`);
    // TODO: clean up
  };

  private sendPeerData = (peerId: string, data: any): void => {
    if (!this.dataConnections.has(peerId)) {
      console.error(`data ${peerId} does not have a data connection`);
      return;
    }

    const conn = this.dataConnections.get(peerId)!;
    conn.send(data);
  };

  /**
   * Adds the media stream to the DOM as a video element.
   *
   * @param stream The media stream to include for the video.
   * @param peerId The id of the peer whose media stream this is.
   */
  private addMediaStreamToDOM = (
    stream: MediaStream,
    peerId?: string
  ): void => {
    const videoEl = document.createElement("video");
    if (peerId === undefined) {
      // it's the user
      videoEl.id = "user";
      videoEl.muted = true;
    }

    videoEl.srcObject = stream;
    videoEl.autoplay = true;
    videoEl.playsInline = true;
    videoEl.height = 360;
    videoEl.width = 480;

    this.domVideos.set("user", videoEl);
    this.videosRef.appendChild(videoEl);
  };
   
  // use button as a toggle switch to provide speaking access
  private flipSpeaking = () : void => {
    let fakeSpeechDisplay = document.getElementById("speakStatus") as HTMLParagraphElement
    if (fakeSpeechDisplay === null){
      throw new Error("Fake status message element was unexpectedly null");
    }
    if (this.isSpeaking){
      this.onStoppedSpeaking()
      fakeSpeechDisplay.innerHTML = "Stopped speaking!"
    }else{
      this.onSpeaking()
      fakeSpeechDisplay.innerHTML = "Now speaking..."
    }
    this.isSpeaking = !this.isSpeaking
  }

   private onSpeaking = (): void => {
    console.log("speaking");
  };
  private onStoppedSpeaking = (): void => {
    console.log("stopped speaking");
  };

  /**
   * Mutes or unmutes the audio tracks for the user's media stream.
   * @param isMuted
   */
  public toggleMuted = (isMuted?: boolean): void => {
    this.audioTrack.enabled = !(isMuted !== undefined
      ? isMuted
      : !this.audioTrack.enabled);
  };

  /**
   * Creates/access the `Room` singleton.
   *
   * @returns
   */
  public static init = async (): Promise<Room> => {
    const roomId = getRoomId();
    if (Room.instance === null) {
      const userStream = await getUserMediaStream();
      Room.instance = new Room(roomId, userStream);
    }
    return Room.instance;
  };
}

Room.init().then((room) => {
  // @ts-ignore
  window.zoomutexRoom = room;
});
