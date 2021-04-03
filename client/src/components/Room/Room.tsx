import "./styles.css";

import React, { useContext, useEffect, useRef, useState } from "react";

import SocketContext from "../../context/SocketContext";
import { roomRoute } from "./route";
import { useRouteMatch } from "react-router";
import useUserMedia from "./useUserMedia";

interface RoomPathArgs {
  roomId?: string;
}

const Room = (): JSX.Element => {
  const match = useRouteMatch<RoomPathArgs>(roomRoute);
  const socket = useContext(SocketContext);
  const [roomId, setRoomId] = useState<string | undefined>(
    match?.params.roomId
  );

  const mediaStream = useUserMedia({ audio: true, video: true });
  const videoRef = useRef<HTMLVideoElement | null>(null);

  if (mediaStream && videoRef.current) {
    videoRef.current.srcObject = mediaStream;
  }

  const onUserConnected = (userId: string): void => {
    console.log(userId);
  };

  useEffect(() => {
    if (!roomId) {
      return;
    }

    socket.emit("join-room", roomId);
    socket.on("user-connected", onUserConnected);

    return () => {
      // disconnect socket
      socket.disconnect();
    };
  }, [roomId, socket]);

  if (match === null || !match.params.roomId) {
    return <div>Invalid room</div>;
  }

  return (
    <div>
      <div className="room-title">Room {match.params.roomId}</div>
      <div className="video-grid">
        <video autoPlay playsInline ref={videoRef} />
      </div>
    </div>
  );
};

export default Room;
