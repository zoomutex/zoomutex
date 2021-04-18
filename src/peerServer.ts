import { ExpressPeerServer } from "peer";
import { Server } from "http";

const startPeerServer = (server: Server) => {
  // Start peerServer and return id to connecting clients
  const peerServer = ExpressPeerServer(server);

  console.log(`Peer server listening`);

  peerServer.on("connection", (client) => {
    console.log(`Peerjs client connected : ` + client.getId());
    //client.send('connected to client')
  });

  peerServer.on("disconnect", (client) => {
    console.log(`Peerjs client disconnected : ` + client.getId());
  });

  peerServer.on("message", (client, message) => {
    if (message.type === "HEARTBEAT") {
      // console.log("Received heartbeat message from : " + client.getId())
      return;
    }

    console.log(
      `Received ${message} from ` + client.getId() + " : " + message.payload
    );
  });

  return peerServer;
};

export default startPeerServer;
