import {
  addBorder,
  getRoomId,
  getUserMediaStream,
  removeBorder,
} from "./utils.js";

import Mutex from "./mutex.js";
import type Peer from "peerjs";
import type hark from "hark";

interface MutexMessage {
  type: "request" | "response" | "startCall" | "unMute";
  message: string;
}

class Room {
  private static instance: Room | null = null;

  private readonly roomId: string;
  private readonly userStream: MediaStream;
  private readonly speechEvents: hark.Harker;
  private readonly peer: Peer | null = null;
  private readonly videosRef: HTMLVideoElement;
  private readonly userStreams = new Set<string>();
  private readonly domVideos = new Map<string, HTMLVideoElement>();
  private readonly dataConnections = new Map<string, Peer.DataConnection>();
  private readonly statusMessage: HTMLParagraphElement;
  private isSpeaking = false;
  private isInitialised = false;
  private mutex: Mutex | null = null;
  private isReleased = false;
  private isRequested = false;

  private constructor(roomId: string, userStream: MediaStream) {
    this.roomId = roomId;
    this.userStream = userStream;

    const tracks = userStream.getAudioTracks();
    if (tracks.length < 0) {
      throw new Error("Could not acquire audio track");
    }

    // The following ts-ignore is necessary because we are importing from a CDN,
    // not from npm.
    // @ts-ignore
    this.speechEvents = hark(this.userStream, {});
    this.speechEvents.setThreshold(-40);
    this.speechEvents.setInterval(250);
    this.speechEvents.on("speaking", this.onSpeaking);
    this.speechEvents.on("stopped_speaking", this.onStoppedSpeaking);

    const createTokenButton = document.getElementById(
      "startMutex"
    ) as HTMLButtonElement;
    if (createTokenButton === null) {
      throw new Error("Button element was unexpectedly null");
    }

    createTokenButton.onclick = () =>
      this.onTokenButtonClick(createTokenButton);

    // Get the reference to `#videos`
    const videosRef = document.getElementById("videos");
    if (videosRef === null) {
      throw new Error("videos element was unexpectedly null");
    }
    this.videosRef = videosRef as HTMLVideoElement;

    // Get the status message DOM element
    const statusMsg = document.getElementById("statusMsg");
    if (statusMsg === null) {
      throw new Error("statusMsg element was unexpectedly null");
    }
    this.statusMessage = statusMsg as HTMLParagraphElement;

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

  private onTokenButtonClick = (btn: HTMLButtonElement): void => {
    if (btn !== null) {
      btn.innerText = "Local mutex object initialised";
    }

    if (this.peer === null) {
      return;
    }

    if (!this.isInitialised) {
      const request: MutexMessage = {
        type: "startCall",
        message: JSON.stringify([this.peer.id, ...this.userStreams]),
      };

      this.sendPeerDataToAll(JSON.stringify(request));

      this.mutex = new Mutex([this.peer.id, ...this.userStreams], this.peer.id);

      console.log(this.mutex.printMutexObject());
      console.log(
        "-----------------------------------------------------------"
      );

      this.isInitialised = true;
      this.muteAllVideos();

      let unMuteMessage: MutexMessage = {
        type: "unMute",
        message: "",
      };
      this.sendPeerDataToAll(JSON.stringify(unMuteMessage));
      this.removeStartButton();
    }
  };

  /**
   * Event handler for when peerjs has opened a connection successfully.
   * Now that peerjs has initialised, we know our peerId. Thus, we can get
   * the ids for the peers currently in the room (or create the room if it does
   * not exist - as the client, we don't really care).
   */
  private onPeerOpen = async (): Promise<void> => {
    // Add the user's own media stream to the DOM
    this.addMediaStreamToDOM(this.userStream, this.peer?.id!);

    console.log(`userId: ${this.peer?.id}`);
    const body = JSON.stringify({ userId: this.peer?.id });

    const res = await fetch(`/${this.roomId}/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body,
    });

    const data: string[] = await res.json();
    //console.log("Inside on peer open " + data);
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
    //console.log(`answering call from ${call.peer}`);
    call.answer(this.userStream);
    call.on("stream", this.onCallStream(call.peer));
  };

  /**
   * Event handler for when a peer disconnected.
   */
  private onPeerDisconnected = (): void => {
    console.log(`disconnected from server`);
  };

  /**
   * Event handler for when we receive the media stream from a call.
   *
   * This function is constructed in this way so we can log the `peerId`.
   */
  private onCallStream =
    (peerId: string) =>
    (stream: MediaStream): void => {
      if (this.userStreams.has(peerId)) {
        //console.log(`ignored superfluous stream from ${peerId}`);
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
    this.onUserDisconnected(peerId);
  };

  /**
   * Event handler for when a call has an error.
   *
   * This function is constructed in this way so we can log the `peerId`.
   */
  private onCallError =
    (peerId: string) =>
    (err: any): void => {
      console.error(`call ${peerId} has had an error: ${err}`);
      this.onUserDisconnected(peerId);
    };

  private onPeerDataConnection = (conn: Peer.DataConnection): void => {
    const peerId = conn.peer;
    // console.log(`received data connection from ${peerId}`);
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

    // console.log("Inside connect to peers "+ typeof(peers));

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

  private onPeerDataReceive =
    (peerId: string) =>
    (data: any): void => {
      console.log(`received data '${data}' from ${peerId}`);
      console.info("Received a mutex message from peer");

      const requestMsg: MutexMessage = JSON.parse(data);
      switch (requestMsg.type) {
        case "unMute": {
          this.onUnMute(peerId);
          return;
        }
        case "request": {
          this.onRequest(peerId, requestMsg);
          return;
        }
        case "response": {
          this.onResponse(peerId, requestMsg);
          return;
        }
        case "startCall": {
          this.onStartCall(requestMsg);
          return;
        }
        default:
          console.log("Invalid type");
      }
    };

  private onUnMute = (peerId: string): void => {
    this.muteAllVideos();
    const tokenUserVideo = document.getElementById(peerId) as HTMLVideoElement;
    addBorder(peerId);
    tokenUserVideo.muted = false;
    console.info("Unmuted - ", peerId);
  };

  private onRequest = (peerId: string, requestMsg: MutexMessage): void => {
    if (this.mutex?.doIHaveToken() === false) {
      this.mutex?.updateSequenceNumber(peerId, parseInt(requestMsg.message));
      return;
    }

    if (this.isSpeaking) {
      // I have the token and I'm speaking
      console.info("TOKEN REQUEST from client while I'm speaking");
      this.mutex?.appendToTokenQueue(peerId);
      this.mutex?.updateSequenceNumber(peerId, parseInt(requestMsg.message));
      return;
    }

    // I'm not speaking
    const rni = parseInt(requestMsg.message);
    console.info(
      `TOKEN REQUEST from client ${peerId} with SEQUENCE number ${rni}`
    );
    let token = this.mutex?.compareSequenceNumber(peerId, rni);
    if (token === undefined) {
      return;
    }

    // I have the token and I'm not speaking
    const msg: MutexMessage = {
      type: "response",
      message: JSON.stringify(token),
    };
    console.info("Token to send is ", token);
    this.sendPeerData(peerId, JSON.stringify(msg));
  };

  private onResponse = (peerId: string, requestMsg: MutexMessage): void => {
    console.info(
      `TOKEN RECEIVED ${peerId} with token data - ${requestMsg.message}`
    );

    const token = JSON.parse(requestMsg.message);
    if (token !== undefined && this.mutex !== undefined) {
      this.mutex?.setTokenObject(token);
    }

    this.muteAllVideos();
    addBorder(this.peer?.id!);

    const msg: MutexMessage = {
      type: "unMute",
      message: "",
    };
    this.sendPeerDataToAll(JSON.stringify(msg));

    this.statusMessage.innerText =
      "Received token, 2 seconds to speak before token is potentially passed to next in queue";
    this.isRequested = false;

    // Due to token being passed based on queue order, if I receive the token at
    // a time I do not wish to speak, I will have to execute CS once before I
    // can release the token to next peer in queue. (due to how the algorithm
    // works).
    // We can add a check to see if user is trying to speak or not.
    // If user is trying to speak, we continue as normal
    // If not, we wait a timeout before sending the token to next peer
    setTimeout(() => {
      if (!this.isSpeaking) {
        let nextPeerId = this.mutex?.releaseCriticalSection(this.peer?.id);

        if (nextPeerId !== undefined) {
          console.info("Sending token to next peer in queue - ", nextPeerId);

          const token = this.mutex?.getTokenObject();
          if (token !== undefined) {
            const msg: MutexMessage = {
              type: "response",
              message: JSON.stringify(token),
            };
            console.info("Token to send is ", token);
            this.sendPeerData(nextPeerId, JSON.stringify(msg));
            this.statusMessage.innerText = "Token sent..";
          }
        } else {
          console.info("No peers in token's queue. Token stays with me");
        }
        this.isReleased = true; //we set if to false when we are speaking
      }
    }, 1000);
  };

  private onStartCall = (msg: MutexMessage): void => {
    const peers: string[] = JSON.parse(msg.message);
    if (peers === undefined || this.peer === null) {
      return;
    }

    this.mutex = new Mutex(peers, this.peer.id);
    console.info(
      "----------------------------Follower person--------------------------------"
    );
    console.info(this.mutex.printMutexObject());
    console.info(
      "---------------------------------------------------------------------------"
    );
    this.isInitialised = true;

    // Remove create token button
    this.removeStartButton();
  };

  private onPeerDataOpen =
    (peerId: string, conn: Peer.DataConnection) => (): void => {
      this.dataConnections.set(peerId, conn);
    };

  private onPeerDataError =
    (peerId: string) =>
    (err: any): void => {
      console.error(`data ${peerId} has had an error: ${err}`);
      this.onUserDisconnected(peerId);
    };

  private onPeerDataClose = (peerId: string) => (): void => {
    console.warn(`data ${peerId} has closed`);
    this.onUserDisconnected(peerId);
  };

  private sendPeerDataToAll = (data: string): void => {
    //console.log("Sending message to all - ", data)
    for (const peerId of this.userStreams) {
      this.sendPeerData(peerId, data);
    }
  };

  private sendPeerData = (peerId: string, data: string): void => {
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
  private addMediaStreamToDOM = (stream: MediaStream, peerId: string): void => {
    const videoEl = document.createElement("video");
    videoEl.id = peerId;
    videoEl.muted = true;

    console.info("added media stream to window");
    videoEl.srcObject = stream;
    videoEl.autoplay = true;
    videoEl.playsInline = true;
    videoEl.height = 360;
    videoEl.width = 480;

    this.domVideos.set(peerId, videoEl);
    this.videosRef.appendChild(videoEl);
  };

  private muteAllVideos = (): void => {
    for (const peerId of this.domVideos.keys()) {
      console.log("Muting all peers");
      const video = document.getElementById(peerId) as HTMLVideoElement;
      video.muted = true;
      removeBorder(peerId);
    }
  };

  private onSpeaking = async (): Promise<void> => {
    console.warn("SPEAKING =============================================");
    this.isSpeaking = true;

    console.log("Do I have the token? - ", this.mutex?.doIHaveToken());
    if (this.mutex === null) {
      this.statusMessage.innerText = "Token not initialised";
      return;
    }

    // incase we do not have the token, we end up sending a request message everytime we speak
    // if we previously sent a request which has not been responded to (i.e its in the token's queue),
    // do we send another request and add duplicates to the queue?
    // or do we not send a request incase we have an outstanding request?
    if (!this.mutex?.doIHaveToken() && this.peer !== undefined) {
      if (this.isRequested) {
        // already sent a token request, awaiting response before sending next request
        this.statusMessage.innerText =
          "Waiting for token response before speaking";
        return;
      }
      let requestMessage: MutexMessage = {
        type: "request", // "tokenRequest",
        message: JSON.stringify(
          this.mutex?.accessCriticalSection(this.peer?.id)
        ),
      };
      this.userStreams.forEach((peer) => {
        this.sendPeerData(peer, JSON.stringify(requestMessage));
      });
      this.isRequested = true; // set false after receiving response
      console.info("Token request sent to all peers, waiting my turn....");

      this.statusMessage.innerText =
        "No Token, request sent to all peers, waiting my turn....";
      return;
    }

    this.isReleased = false; // we set it to true when stop speaking

    console.info("I have the power to speak");
    addBorder(this.peer?.id!);
    this.statusMessage.innerText = "I have the token, I am speaking...";
  };

  private onStoppedSpeaking = (): void => {
    console.warn(
      "STOPPED SPEAKING ============================================="
    );
    this.isSpeaking = false;

    // this check prevents repeated calls to mutex.releaseCriticalSection
    if (this.isReleased) {
      console.log(
        "I have already released CS and sent token, " +
          "this method is called automatically by 'hark' whenever your audio signals a stopped-speech event"
      );

      if (!this.mutex?.doIHaveToken()) {
        return;
      }

      console.log(this.mutex?.doIHaveToken());
    }
    console.log("Stopped speaking");

    setTimeout(() => {
      if (this.peer !== null) {
        console.info("Stopped speaking, Releasing critical section");

        let nextPeerId = this.mutex?.releaseCriticalSection(this.peer?.id);
        if (nextPeerId !== undefined) {
          console.info("Sending token to next peer in queue - ", nextPeerId);
          let itokenToSend = this.mutex?.getTokenObject();
          if (itokenToSend !== undefined) {
            const msg: MutexMessage = {
              type: "response",
              message: JSON.stringify(itokenToSend),
            };
            console.info("Token to send is ", itokenToSend);
            this.sendPeerData(nextPeerId, JSON.stringify(msg));
          }
        } else {
          console.info("No peers in token's queue. Token stays with me");
        }

        this.statusMessage.innerText = "Stopped speaking!";
        this.isReleased = true; //we set if to false when we are speaking
      }
    }, 1000);
  };

  private removeStartButton = (): void => {
    document.getElementById("startMutex")?.remove();
  };

  private onUserDisconnected = (peerId: string): void => {
    document.getElementById(peerId)?.remove();
    this.statusMessage.innerText =
      "Someone has disconnected - this may have broken the mutual exclusion";
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
