import React from "react";
import { io } from "socket.io-client";

export const socket = io(window.location.origin);
export const SocketContext = React.createContext(socket);
