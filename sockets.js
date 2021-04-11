"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_1 = require("socket.io");
const log = (socket, msg) => {
    console.log(`(socket ${socket.id}): ${msg}`);
};
const onDisconnected = (socket, args) => {
    log(socket, `userId ${args === null || args === void 0 ? void 0 : args.userId} is trying to disconnect from room ${args === null || args === void 0 ? void 0 : args.roomId}`);
    let userId = args === null || args === void 0 ? void 0 : args.userId;
    let roomId = args === null || args === void 0 ? void 0 : args.roomId;
    if (!roomId || !userId) {
        console.log(`userId ${args === null || args === void 0 ? void 0 : args.userId} failed to disconnect from room ${args === null || args === void 0 ? void 0 : args.roomId}`);
        return;
    }
    socket.to(roomId).emit("user-disconnected", { userId });
};
const onJoinRoom = (socket, args) => __awaiter(void 0, void 0, void 0, function* () {
    log(socket, `userId ${args === null || args === void 0 ? void 0 : args.userId} is joining room ${args === null || args === void 0 ? void 0 : args.roomId}`);
    let userId = args === null || args === void 0 ? void 0 : args.userId;
    let roomId = args === null || args === void 0 ? void 0 : args.roomId;
    if (!roomId || !userId) {
        log(socket, `userId ${args === null || args === void 0 ? void 0 : args.userId} failed to join room ${args === null || args === void 0 ? void 0 : args.roomId}`);
        return;
    }
    yield socket.join(roomId);
    log(socket, `notifying room ${roomId}`);
    socket.join(roomId);
    socket.to(roomId).emit("user-connected", { userId });
    socket.on("disconnected", () => onDisconnected(socket, { userId, roomId }));
});
const onConnection = (socket) => {
    log(socket, `connected`);
    socket.on("join-room", (args) => onJoinRoom(socket, args));
};
const initSockets = (httpServer) => {
    const socketServer = new socket_io_1.Server(httpServer);
    socketServer.on("connection", onConnection);
};
exports.default = initSockets;
