import { PeerServer } from "peer";

//Genearate a random id for a client that connects
const customGenerationFunction = () =>
  (Math.random().toString(36) + "0000000000000000000").substr(2, 16);

const startPeerServer = (): void => {
  // Start peerServer and return id to connecting clients
  const peerServer = PeerServer({
    path: "/peerServer",
    port: 9000,
    generateClientId: customGenerationFunction,
  });

  console.log(`Peer server listening`);

  peerServer.on("connection", (client) => {
    console.log(`Peerjs client connected : ` + client.getId());
    //client.send('connected to client')
  });

  peerServer.on("disconnect", (client) => {
    console.log(`Peerjs client disconnected : ` + client.getId());
  });

  peerServer.on("message", (client, message) => {
    if (message.type == "HEARTBEAT") {
      // console.log("Received heartbeat message from : " + client.getId())
      return;
    }

    console.log(
      `Received ${message} from ` + client.getId() + " : " + message.payload
    );
  });
};

export default startPeerServer;
