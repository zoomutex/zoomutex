import "./styles.css";

import { PeerContext, SocketContext } from "../../context";
import { useCallback, useContext, useEffect, useRef, useState } from "react";

import { MediaConnection } from "peerjs";
import Video from "./Video";
import { roomRoute } from "./route";
import { useRouteMatch } from "react-router";
import useUserMedia from "./useUserMedia";
import { v4 as uuid } from "uuid";

interface RoomPathArgs {
  roomId?: string;
}

interface UserConnectedArgs {
  userId?: string;
}

interface MediaElement {
  stream: MediaStream;
  userId: string;
}

const Room = (): JSX.Element => {
  const match = useRouteMatch<RoomPathArgs>(roomRoute);

  const socket = useContext(SocketContext);
  const peer = useContext(PeerContext);

  const [roomId] = useState<string | undefined>(match?.params.roomId);
  const [userId] = useState<string>(uuid());
  const userMediaStream = useUserMedia({ audio: true, video: true });
  const [streams, setStreams] = useState<MediaElement[]>([]);

  const addCallToRoom = useCallback(
    (call: MediaConnection) => {
      console.log("handle call");

      call.on("stream", (stream) => {
        console.log(`adding stream for ${userId}`);
        setStreams([...streams, { userId, stream }]);
      });

      call.on("close", () => {
        console.log(`closing call for ${userId}`);
        setStreams(streams.filter((current) => current.userId !== userId));
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
    (args: UserConnectedArgs): void => {
      console.log(args);
      const { userId: connectedUserId } = args;
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
    if (!roomId) {
      return;
    }

    console.log("joining room");
    socket.emit("join-room", { roomId, userId });
    socket.on("user-connected", onUserConnected);

    peer.on("open", onPeerOpen);
    peer.on("call", answerCall);

    return () => {
      // disconnect socket
      console.log("disconnecting")
      socket.disconnect();
    };
  }, [
    addCallToRoom,
    answerCall,
    onPeerOpen,
    onUserConnected,
    peer,
    roomId,
    socket,
    userId,
  ]);

  useEffect(() => {
    window.onbeforeunload = () => {
      console.log("cleaning up");
      socket.disconnect();
    };
  }, [socket]);

  if (match === null || !match.params.roomId) {
    return <div>Invalid room</div>;
  }

  return (
    <div>
      <div className="room-title">Room {match.params.roomId}</div>
      <div className="video-grid">
        <Video mediaStream={userMediaStream} />
        {streams.map(({ stream, userId }) => (
          <Video key={userId} mediaStream={stream} />
        ))}
      </div>
    </div>
  );
};

export default Room;
