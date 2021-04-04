import { PeerServer } from 'peer';

const PEER_PORT = 9000;

//Genearate a random id for a client that connects
const customGenerationFunction = () => (Math.random().toString(36) + '0000000000000000000').substr(2, 16);

const startPeerServer = (): void => {

    // Start peerServer and return id to connecting clients
    const peerServer = PeerServer({
      port: PEER_PORT,
      path: "/peerServer",
      generateClientId: customGenerationFunction,
    });  

    console.log(`PeerServer listening on - ${PEER_PORT}/peerServer `)
    peerServer.on('connection', (client) => { 
      console.log(`Client connected : ` + client.getId())
      //client.send('connected to client')
    });
    peerServer.on('disconnect', (client) => {
      console.log(`Client disconnected : ` + client.getId())
    });
    peerServer.on("message", (client, message) => {
      if (message.type == 'HEARTBEAT'){
       // console.log("Recieved heartbeat message from : " + client.getId())
        return null
      }
      console.log(`Received ${message} from ` + client.getId() + " : " + message.payload)
    })
  }

export default startPeerServer;