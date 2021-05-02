
import { type } from "os";
import type Peer from "peerjs";
import Token from "./token"

//type peerPlaceHolder = Peer
type peerPlaceHolder = string

export default class MutexMagic {
    
    private token : Token
    private requestSequenceNumbers : Map<peerPlaceHolder, number> // RN[i]
    
    constructor(peers: peerPlaceHolder[]){
        // initialise an empty token, 
        this.token = new Token(peers) 
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
    public doIhaveToken?() : boolean {
        return this.token.peerCount >= 1
    }
    // This method is called when this client has passed the token to another client
    public removeToken() {
        this.token = new Token([]) // this will set token.peerCount = 0
    }

    // releaseCriticalSection is called when this client has completed execution of the
    // critical section.
    public releaseCriticalSection() : Token | undefined {

        /** algo - update token object
         - sets LN[i] = RNi[i] to indicate that its critical section request RNi[i] has been executed
         - For every site Sj, whose ID is not prsent in the token queue Q, it appends its ID to Q if 
           RNi[j] = LN[j] + 1 to indicate that site Sj has an outstanding request.
         - After above updation, if the Queue Q is non-empty, it pops a site ID from the Q and sends 
           the token to site indicated by popped ID.
         - If the queue Q is empty, it keeps the token
         */

        if (this.token.queueSize() == 0){
            return undefined // keep the token with this client
        } else {
            return this.getTokenObjectToSendToPeer() //
        }
    }

    public actionPlaceholder(){
        this.token.actionPlaceholder()
    }
}