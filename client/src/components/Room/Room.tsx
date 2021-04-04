import "./styles.css";

import { PeerContext, SocketContext } from "../../context";
import VideoList, { Streams } from "./VideoList";
import { useCallback, useContext, useEffect, useRef, useState } from "react";

import { MediaConnection } from "peerjs";
import Video from "./Video";
import { roomRoute } from "./route";
import { useRouteMatch } from "react-router";
import useUserMedia from "./useUserMedia";

interface RoomPathArgs {
  roomId?: string;
}

interface UserConnectedArgs {
  userId?: string;
}

const Room = (): JSX.Element => {
  const match = useRouteMatch<RoomPathArgs>(roomRoute);

  const socket = useContext(SocketContext);
  const peer = useContext(PeerContext);

  const [roomId] = useState<string | undefined>(match?.params.roomId);
  const userId = peer.id

  const userMediaStream = useUserMedia({ audio: true, video: true });
  const [streams, setStreams] = useState<Streams>({});

  const addCallToRoom = useCallback(
    (call: MediaConnection) => {
      console.log("handle call");

      call.on("stream", (stream) => {
        console.log(`adding stream for ${userId}`);
        setStreams({
          ...streams,
          [userId]: stream,
        });
      });

      call.on("close", () => {
        console.log(`closing call for ${userId}`);

        const updatedStreams = { ...streams };
        delete updatedStreams[userId];
        setStreams(updatedStreams);
      });

      console.log(`user connected: ${userId}`);
    },
    [streams, userId]
  );

  const callPeer = useCallback(
    (userId: string) => {
      console.log("call joining group");
      if (!userMediaStream) {
        return;
      }

      // Call the user who just joined
      const call = peer.call(userId, userMediaStream);
      addCallToRoom(call);
    },
    [addCallToRoom, peer, userMediaStream]
  );

  const deferredUserIds = useRef<string[]>([]);

  useEffect(() => {
    console.log(`calling ${deferredUserIds.current.length} deferred user ids`);

    for (const userId of deferredUserIds.current) {
      callPeer(userId);
    }

    deferredUserIds.current = [];
  }, [callPeer]);

  // When we first open the app, join a room
  const onPeerOpen = useCallback(
    (userId: string): void => {
      if (!roomId) {
        return;
      }

      socket.emit("join-room", { roomId, userId });
    },
    [roomId, socket]
  );

  const onUserConnected = useCallback(
    ({ userId: connectedUserId }: UserConnectedArgs): void => {
      console.log("user attempting to connect");

      if (!connectedUserId) {
        return;
      }

      if (!userMediaStream) {
        deferredUserIds.current.push(connectedUserId);
        console.log(
          `deferred userId ${connectedUserId} while waiting for connection`
        );
        return;
      }

      callPeer(connectedUserId);
    },
    [callPeer, userMediaStream]
  );

  const answerCall = useCallback(
    (call: MediaConnection) => {
      if (userMediaStream) {
        console.log("answering call");
        call.answer(userMediaStream);
      } else {
        console.error("could not answer call");
      }
    },
    [userMediaStream]
  );

  useEffect(() => {
    if (!roomId || !userMediaStream) {
      console.log("waiting for user media stream");
      return;
    }

    console.log("joining room");
    socket.emit("join-room", { roomId, userId });
    socket.on("user-connected", onUserConnected);

    peer.on("open", onPeerOpen);
    peer.on("call", answerCall);
  }, [
    answerCall,
    onPeerOpen,
    onUserConnected,
    peer,
    roomId,
    socket,
    userId,
    userMediaStream,
  ]);

  useEffect(() => {
    window.onbeforeunload = () => {
      console.log("cleaning up");
      socket.disconnect();
      peer.destroy();
    };
  }, [peer, socket]);

  if (match === null || !match.params.roomId) {
    return <div>Invalid room</div>;
  }

  return (
    <div>
      <div className="room-title">Room {match.params.roomId}</div>
      <div className="video-grid">
        <Video mediaStream={userMediaStream} />
        <VideoList streams={streams} />
      </div>
    </div>
  );
};

export default Room;
