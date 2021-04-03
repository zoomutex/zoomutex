import React, { useContext, useEffect, useState } from "react";

import SocketContext from "../../SocketContext";
import { roomRoute } from "./route";
import { useRouteMatch } from "react-router";

interface RoomPathArgs {
  roomId?: string;
}

const Room = (): JSX.Element => {
  const match = useRouteMatch<RoomPathArgs>(roomRoute);
  const socket = useContext(SocketContext)
  const [roomId, setRoomId] = useState<string | undefined>(match?.params.roomId)

  const onUserConnected = (userId: string): void => {
    console.log(userId)
  }

  useEffect(() => {
    if (!roomId) {
      return
    }

    socket.emit('join-room', roomId)
    socket.on('user-connected', onUserConnected)

    return () => {
      // disconnect socket
      socket.disconnect()
    }
  }, [roomId, socket])

  if (match === null || !match.params.roomId) {
    return <div>Invalid room</div>;
  }

  return <div>Room {match.params.roomId}</div>;
};

export default Room;
