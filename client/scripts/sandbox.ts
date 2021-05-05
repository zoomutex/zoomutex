import MutexMagic from "./suzuKasa"

import Token from "./token"

// using peerPlaceHolder as string for sandbox.
// in reality, it can be the actual Peer object from Peerjs
const peers = ["client2", "client4", "client3", "client1"]
const me = "client4"
const clientWithToken = "client2"

// on initialisation, we can delegate the token to the first peer in the list
// every other peer will have an empty token

// this is client 4
var suzuki_Object_at_client4 = new MutexMagic(peers, me)
console.log(suzuki_Object_at_client4.doIhaveToken()) // false as token would be with 1st index -> client2

console.log("I am client 4 - ")
suzuki_Object_at_client4.printMutexObject()

// this client wants to access critical section 
// it does not have the token and wants to get token from peers
const sequenceNumberToSendInMessage = suzuki_Object_at_client4.accessCriticalSection("client4") // RNi[i]
let requestMessage = {
    rni : sequenceNumberToSendInMessage
}
console.log("")
console.log("I now send a token request to all clients")
peers.forEach( peer => {
    //send messsage to send -> with data = requestMessage
    console.log("Message from client 4 has sequence number = ", requestMessage.rni)
})
console.log("-----------------------------------------------")

//below we define a token and we modify some data in the token to 
//make it seem like a valid token after some circulation in the system
var tokenAftersomeTime = new Token(peers)
tokenAftersomeTime.updateSequenceNumber("client2", 1)
tokenAftersomeTime.appendToQueue("client3")
console.log("assume the token below is how it exists in the sytem after some circulation")
tokenAftersomeTime?.printTokenData()

// Assume currently client 2 has this token, 
// it would also have recieved it during initialisation
const suzuki_Object_at_client2 = new MutexMagic(peers, clientWithToken)
console.log(suzuki_Object_at_client2.doIhaveToken()) // true
suzuki_Object_at_client2.setTokenObject(tokenAftersomeTime)

// client 2 receives the request from client 4
console.log("I am client 2 and I recieved this request from client-4")
console.log("Mutex object at client 2 - ")
suzuki_Object_at_client2.printMutexObject()
console.log("Comparing sequence numbers - ")
// we receive request from client 4 with sequence number
let tokenToSend = suzuki_Object_at_client2.compareSequenceNumber("client4", requestMessage?.rni)
if (tokenToSend != undefined){
    // as sequence number check passed, i will send my token to client 4
    // send token to client4
    console.log(suzuki_Object_at_client2.doIhaveToken()) // false
    console.log("I have sent the token to the other client")
    console.log("Token sent by client 2 - ")
    tokenToSend.printTokenData()
    console.log("Mutex object at client 2 - ")
    suzuki_Object_at_client2.printMutexObject()
}
console.log("-----------------------------------------------")

console.log("I am client 4 and I received this token after my request")
//we as client 4 have received this token from client 2 after requesting it
if (tokenToSend) {
    suzuki_Object_at_client4.setTokenObject(tokenToSend)
    console.log(suzuki_Object_at_client4.doIhaveToken()) // true

    console.log("Mutex object at client 4, before Critical Section")
    suzuki_Object_at_client4.printMutexObject()
    // executing C.S.
    console.log("client 4 - Executing Critical section")
    // release C.S
    console.log("client 4 - Releasing Critical section")

    // this method will pop a value from the queue as well
    const nextClient = suzuki_Object_at_client4.releaseCriticalSection("client4")
    console.log("Mutex object at client 4, after releasing Critical Section")
    suzuki_Object_at_client4.printMutexObject()
    if (nextClient != undefined){
        console.log("There was a peer in the queue - ", nextClient)
        console.log("Sending token to this peer")
        tokenToSend = suzuki_Object_at_client4.getTokenObjectToSendToPeer() 
        console.log(suzuki_Object_at_client4.doIhaveToken()) // false
        console.log("I am now sending my token to the other client")
        console.log("Token sent by client 4 - ")
        tokenToSend?.printTokenData()
        console.log("Mutex object at client 4 - ")
        suzuki_Object_at_client4.printMutexObject()
    }
}
console.log("-----------------------------------------------")