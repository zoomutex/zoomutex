import React from "react";
import { roomRoute } from "./route";
import { useRouteMatch } from "react-router";

interface RoomPathArgs {
  roomId?: string;
}

const Room = (): JSX.Element => {
  const match = useRouteMatch<RoomPathArgs>(roomRoute);

  if (match === null || !match.params.roomId) {
    return <div>Invalid room</div>;
  }

  return <div>Room {match.params.roomId}</div>;
};

export default Room;
