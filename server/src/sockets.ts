import { Socket, Server as SocketServer } from "socket.io";

import { Server } from "http";

interface UserRoomArgs {
  roomId?: string;
  userId?: string;
}

const log = (socket: Socket, msg: string): void => {
  console.log(`(socket ${socket.id}): ${msg}`);
};

const onDisconnected = (socket: Socket, args: UserRoomArgs): void => {
  log(
    socket,
    `userId ${args?.userId} is trying to disconnect from room ${args?.roomId}`
  );

  let userId = args?.userId;
  let roomId = args?.roomId;

  if (!roomId || !userId) {
    console.log(
      `userId ${args?.userId} failed to disconnect from room ${args?.roomId}`
    );
    return;
  }
  socket.to(roomId).emit("user-disconnected", { userId });
};

const onJoinRoom = async (
  socket: Socket,
  args?: UserRoomArgs
): Promise<void> => {
  log(socket, `userId ${args?.userId} is joining room ${args?.roomId}`);

  let userId = args?.userId;
  let roomId = args?.roomId;

  if (!roomId || !userId) {
    log(socket, `userId ${args?.userId} failed to join room ${args?.roomId}`);
    return;
  }

  await socket.join(roomId);

  log(socket, `notifying room ${roomId}`);
  socket.join(roomId);
  socket.to(roomId).emit("user-connected", { userId });
  socket.on("disconnected", () => onDisconnected(socket, { userId, roomId }));
};

const onConnection = (socket: Socket): void => {
  log(socket, `connected`);

  socket.on("join-room", (args) => onJoinRoom(socket, args));
};

const initSockets = (httpServer: Server): void => {
  const socketServer = new SocketServer(httpServer);
  socketServer.on("connection", onConnection);
};

export default initSockets;
