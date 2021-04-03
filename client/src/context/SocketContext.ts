import React from "react";
import { io } from "socket.io-client";

/**
 * The socket used by this application. Only to be imported by the application
 * root.
 */
export const socket = io(`http://localhost:3000`);
const SocketContext = React.createContext(socket);
export default SocketContext;
