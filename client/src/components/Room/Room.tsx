import "./styles.css";

import { PeerContext, SocketContext } from "../../context";
import { useCallback, useContext, useEffect, useRef, useState } from "react";

import Video from "./Video";
import VideoList from "./VideoList";
import { roomRoute } from "./route";
import { useCallPeer } from "./useCallPeer";
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
  const [roomId] = useState<string | undefined>(match?.params.roomId);

  const socket = useContext(SocketContext);
  const peerjs = useContext(PeerContext);

  const userMediaStream = useUserMedia({ audio: true, video: true });
  const [callPeer, streams] = useCallPeer(peerjs, userMediaStream);

  const deferredUserIds = useRef<string[]>([]);

  useEffect(() => {
    console.log(`calling ${deferredUserIds.current.length} deferred user ids`);

    for (const userId of deferredUserIds.current) {
      callPeer(userId);
    }

    deferredUserIds.current = [];
  }, [callPeer]);

  /**
   * Event handler for when a new user connects to the room.
   */
  const onUserConnected = useCallback(
    ({ userId }: UserConnectedArgs): void => {
      console.log("user attempting to connect");

      // Ignore undefined users
      if (!userId) {
        console.error("user was invalid");
        return;
      }

      // If our media stream isn't running yet, defer connecting to the new user
      if (!userMediaStream) {
        deferredUserIds.current.push(userId);
        console.log(`deferred userId ${userId} while waiting for media stream`);
        return;
      }

      console.log("calling peer");
      callPeer(userId);
    },
    [callPeer, userMediaStream]
  );

  useEffect(() => {
    if (!roomId || !userMediaStream) {
      console.log("waiting for user media stream");
      return;
    }

    console.log("joining room");
    socket.emit("join-room", { roomId, userId: peerjs.id });
    socket.on("user-connected", onUserConnected);

    peerjs.on("open", (userId) => {
      socket.emit("join-room", { roomId, userId });
    });

    peerjs.on("call", (call) => {
      call.answer(userMediaStream);
    });
  }, [onUserConnected, peerjs, roomId, socket, userMediaStream]);

  useEffect(() => {
    window.onbeforeunload = () => {
      console.log("cleaning up");
      socket.disconnect();
      peerjs.destroy();
    };
  }, [peerjs, socket]);

  if (match === null || !match.params.roomId) {
    return <div>Invalid room</div>;
  }

  return (
    <div>
      <div className="room-title">Room {match.params.roomId}</div>
      <div className="video-grid">
        <Video mediaStream={userMediaStream} isCamera={true} />
        <VideoList streams={streams} />
      </div>
    </div>
  );
};

export default Room;
