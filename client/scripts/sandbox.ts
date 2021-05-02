import MutexMagic from "./suzuKasa"

import Token from "./token"

// using peerPlaceHolder as string for sandbox.
// in reality, it will be the actual Peer object from Peerjs

const peers = ["client4", "client2", "client3", "client1"]

var suzuki = new MutexMagic(peers)
suzuki.actionPlaceholder() // print this client's token object after initialisation



/*
 case where this client receives a token from another client
 */

 // this will be a token received from another client
const imaginaryTokenRecivedFromAnotherPeer = new Token(peers)
imaginaryTokenRecivedFromAnotherPeer.appendToQueue(peers[3])
// we set token of this client as the one we receive
suzuki.setTokenObject(imaginaryTokenRecivedFromAnotherPeer)
suzuki.actionPlaceholder() // print this client's token object 

/*
 case where this client exits C.S, 
 */
 // simulate some scenario 
const token = suzuki.releaseCriticalSection()
token?.actionPlaceholder()
