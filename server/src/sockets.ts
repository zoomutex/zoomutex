import { Socket, Server as SocketServer } from "socket.io";

import { Server } from "http";

interface UserRoomArgs {
  roomId?: string;
  userId?: string;
}

const onDisconnected = (socket: Socket, args: UserRoomArgs): void => {
  let userId = args?.userId;
  let roomId = args?.roomId;

  if (!roomId || !userId) {
    return;
  }
  socket.to(roomId).emit("user-disconnected", { userId });
};

const onJoinRoom = (socket: Socket, args?: UserRoomArgs) => {
  let userId = args?.userId;
  let roomId = args?.roomId;

  if (!roomId || !userId) {
    return;
  }

  socket.join(roomId);
  socket.to(roomId).emit("user-connected", { userId });
  socket.on("disconnected", () => onDisconnected(socket, { userId, roomId }));
};

const onConnection = (socket: Socket): void => {
  socket.on("join-room", (args) => onJoinRoom(socket, args));
};

const initSockets = (httpServer: Server): void => {
  const socketServer = new SocketServer(httpServer);
  socketServer.on("connection", onConnection);
};

export default initSockets;
