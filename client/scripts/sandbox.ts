import MutexMagic from "./suzuKasa"

import Token from "./token"

// using peerPlaceHolder as string for sandbox.
// in reality, it will be the actual Peer object from Peerjs

// we are client 4
const peers = ["client4", "client2", "client3", "client1"]

var suzuki = new MutexMagic(peers)
suzuki.actionPlaceholder() // print this client's token object after initialisation

//  are client 4
// this client does not have the token and wants to get token from peers
const sequenceNumberToSendInMessage = suzuki.accessCriticalSection("client4") // RNi[i]
let requestMessage = {
    rni : -1
}

peers.forEach( peer => {
    //simulate messsage to send 
    requestMessage = { rni : sequenceNumberToSendInMessage }
    //send
})

//we are client with token
var tokenAftersomeTime = new Token(peers)
tokenAftersomeTime.appendToQueue("client2")
// we receive request from client 4 with sequence number
const myToken = suzuki.compareSequenceNumber("client2", requestMessage?.rni)
if (myToken != undefined){
    // send myToken to client4
}
suzuki.actionPlaceholder() // print this client's token object after initialisation

/*
 case where this client exits C.S, 
 */
 // simulate some scenario 
const token = suzuki.releaseCriticalSection()
token?.actionPlaceholder()
