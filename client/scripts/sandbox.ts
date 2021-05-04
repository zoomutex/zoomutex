import MutexMagic from "./suzuKasa"

import Token from "./token"

// using peerPlaceHolder as string for sandbox.
// in reality, it will be the actual Peer object from Peerjs

// we are client 4
const peers = ["client4", "client2", "client3", "client1"]

var suzuki = new MutexMagic(peers)
suzuki.actionPlaceholder() // print this client's token object after initialisation

//  we are client 4
// this client does not have the token and wants to get token from peers
const sequenceNumberToSendInMessage = suzuki.accessCriticalSection("client4") // RNi[i]
let requestMessage = {
    rni : -1
}
console.log("I am client 4 and i send token request to all clients")
peers.forEach( peer => {
    //simulate messsage to send 
    requestMessage = { rni : sequenceNumberToSendInMessage }
    //send
})
console.log("-----------------------------------------------")

console.log("I am client 2 and I recieved this request")
//we are client with token
var tokenAftersomeTime = new Token(peers)
tokenAftersomeTime.appendToQueue("client2")
tokenAftersomeTime.appendToQueue("client3")
console.log("assume this it the token that exists in the sytem after some time")
console.log("This is the token i have, this is what i will send to requesting client")
tokenAftersomeTime?.actionPlaceholder()


// we receive request from client 4 with sequence number
// compare sequence number, assume its right 
// suzuki.compareSequenceNumber("client2", requestMessage?.rni)
var myToken = tokenAftersomeTime
if (myToken != undefined){
    // send myToken to client4
}
console.log("I am now sending my token to the other client")
console.log("token saved with me - ")
suzuki.actionPlaceholder() // print this client's token object after initialisation
console.log("token I am sending- ")
myToken?.actionPlaceholder() // print this client's token object after initialisation
console.log("-----------------------------------------------")

console.log("I am client 4 and i received this token after my request")
//we as client 4 have received this token from client 2 after requesting it
if (myToken) {
    suzuki.setTokenObject(myToken)
    suzuki.actionPlaceholder()
    // executing C.S.
    // release C.S
    // update token LN[i] and queue

}
console.log("-----------------------------------------------")



/*
 case where this client exits C.S, 
 */
 // simulate some scenario 
const token = suzuki.releaseCriticalSection()
//token?.actionPlaceholder()
