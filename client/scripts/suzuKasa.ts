
import { type } from "os";
import type Peer from "peerjs";
import Token from "./token"

//type peerPlaceHolder = Peer
type peerPlaceHolder = string

export default class MutexMagic {
    
    private token : Token
    private requestSequenceNumbers : Map<peerPlaceHolder, number> // RN[i]
    
    constructor(peers: peerPlaceHolder[], self : peerPlaceHolder){
        // on initialisation, we delegate the token to the first peer in the list
        // every other peer will have an empty token
        if (self == peers[0]) {
                this.token = new Token(peers)
        }
        else {
            this.token = new Token([])
        } 
        this.requestSequenceNumbers = new Map<peerPlaceHolder, number>()

        peers.forEach(peer => {
            this.requestSequenceNumbers.set(peer, 0) // every peer starts at 0
        });
    }

    // this method will return the current token object, which can be sent to another peer. 
    // It will also set the current token object as empty
    public getTokenObjectToSendToPeer() : Token {
        const token = this.token
        this.removeToken()
        return token
    }
    // this method will set the current token object as the one received from another peer
    public setTokenObject(token: Token) {
        this.token = token
    }
    public doIhaveToken() : boolean {
        return this.token.peerCount >= 1
    }
    // This method is called when this client has passed the token to another client
    public removeToken() {
        this.token = new Token([]) // this will set token.peerCount = 0
    }

    // releaseCriticalSection is called when this client has completed execution of the
    // critical section. After all checks, it returns the Peer object that is next in queue for the token
    // or null if queue is empty
    public releaseCriticalSection(peer: peerPlaceHolder) : peerPlaceHolder | undefined {
        let nextTokenPeer : peerPlaceHolder | undefined

        /** algo - update token object
         - sets LN[i] = RNi[i] to indicate that its critical section request RNi[i] has been executed
         - For every site Sj, whose ID is not present in the token queue Q, it appends its ID to Q if 
           RNi[j] = LN[j] + 1 to indicate that site Sj has an outstanding request.
         - After above updation, if the Queue Q is non-empty, it pops a site ID from the Q and sends 
           the token to site indicated by popped ID.
         - If the queue Q is empty, it keeps the token
         */
        const localSequenceNumber = this.requestSequenceNumbers.get(peer)
        if (localSequenceNumber != undefined){
            // update sequence array of the token -> sets LN[i] = RNi[i]
            this.token.updateSequenceNumber(peer, localSequenceNumber)

            this.requestSequenceNumbers.forEach((num, peer) => {
                // if this peer does now exist in the queue
                if (!this.token.lookupQueue(peer)){
                    // and, if RN[j] == LN[j] + 1
                    let outstandingSqncNum = this.token.getSequenceNumber(peer) 
                    if (outstandingSqncNum != undefined){
                        outstandingSqncNum = outstandingSqncNum + 1
                        if (num == outstandingSqncNum){
                            this.token.appendToQueue(peer)
                        }
                    }
                }
               
            })
            
            // if the Queue Q is non-empty, it pops a site ID from the Q and sends 
            // the token to site indicated by popped ID
            if (this.token.queueSize() >= 0){
                nextTokenPeer = this.token.popFromQueue()  
            }
            // else, we keep the token with this client
        }
        return nextTokenPeer
    }

    public printMutexObject(){
        console.log("Local request sequence numbers map:")
        this.requestSequenceNumbers.forEach(e => {
            console.log("  " + e)
        })
        this.token.printTokenData()
        console.log("")
    }

    // this method increments the local sequence number value for a specific peer
    // by 1. It returns the incremented value
    public accessCriticalSection(peer : peerPlaceHolder): number {
        let rni = this.requestSequenceNumbers.get(peer)
        if (rni !=  undefined){
            rni = rni + 1
            this.requestSequenceNumbers.set(peer, rni)
            return rni
        }
        return -1
    }



    // this method compares the sequence number of a peer with the currently existing
    // sequence number in the local array, to filter outdated requests
    // on a valid check, it sets the local token to null and returns the actual token
    // on an invalid check, it returns undefined to indicated outdated request
    public compareSequenceNumber(peer: peerPlaceHolder, sqncNum: number): Token | undefined{
        const currentNum = this.requestSequenceNumbers.get(peer)
        const localSequenceNumber = this.requestSequenceNumbers.get(peer)
        console.log("Before condition: local request array "+localSequenceNumber);
        const currentExecutionNum = this.token.getSequenceNumber(peer)
        console.log(currentExecutionNum);
        console.log(sqncNum);
        if (currentNum != undefined && currentExecutionNum!= undefined){
            if (currentNum < sqncNum){
                
                //updating own local request array
                this.requestSequenceNumbers.set(peer, sqncNum)
                console.log("After condition: local request array "+this.requestSequenceNumbers.get(peer));

                //Checking the second condition RNj[i] = LN[i] + 1
                if(this.requestSequenceNumbers.get(peer) == currentExecutionNum+1){

                    // send token to requesting client
                    return this.getTokenObjectToSendToPeer()
                }
                
            } else{
                return undefined
            }
        }
    }
}