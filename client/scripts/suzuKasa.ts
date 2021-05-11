import { threadId } from "worker_threads"
import Token, { IToken } from "./token.js"

type PeerId = string

export default class Mutex {
    
   private token : Token
   private requestSequenceNumbers : Map<PeerId, number> // RN[i]
    
    constructor(peers: PeerId[], self ?: PeerId){

        console.log("Self", self)
        console.log("Order inside constructor is")
        peers.forEach(e => {
            console.log( e);
        })
        // on initialisation, we delegate the token to the first peer in the list
        // every other peer will have an empty token
        if (self === peers[0]) {
                console.log("This user has the token");
                this.token = new Token(peers)
        }
        else {
            console.log("This user does not have the token");
            this.token = new Token([])
        } 

        this.requestSequenceNumbers = new Map<PeerId, number>()

        peers.forEach(peer => {
            this.requestSequenceNumbers.set(peer, 0) // every peer starts at 0
        });
    }

    // this method will return the current token object, which can be sent to another peer. 
    // It will also set the current token object as empty
    public getTokenObjectToSendToPeer() : IToken {
        const token = this.token.toIToken()
        this.removeToken()
        return token
    }
    // this method will set the current token object as the one received from another peer
    public setTokenObject(token: IToken) {
        console.info("I now have the token")
        this.token.peerCount =  token.peerCount
        this.token.tokenQ.queue = token.tokenQ.queue
        this.token.tokenQ.queueSize = token.tokenQ.queueSize
       this.token.executedSequenceNumbers = new Map<string, number>();
       for (const [key, val] of token.executedSequenceNumbers) {
           this.token.executedSequenceNumbers.set(key, val)
       }
    }
    public doIhaveToken() : boolean {
        return this.token.peerCount >= 1
    }
    // This method is called when this client has passed the token to another client
    public removeToken() {
        console.info("I no longer have the token")
        this.token = new Token([]) // this will set token.peerCount = 0
    }

    // // releaseCriticalSection is called when this client has completed execution of the
    // // critical section. After all checks, it returns the Peer object uthat is next in queue for the token
    // // or null if queue is empty
    public releaseCriticalSection(peer: PeerId | undefined) : PeerId | undefined {
        if (peer === undefined) return undefined
        let nextTokenPeer : PeerId | undefined

    //     /** algo - update token object
    //      - sets LN[i] = RNi[i] to indicate that its critical section request RNi[i] has been executed
    //      - For every site Sj, whose ID is not present in the token queue Q, it appends its ID to Q if 
    //        RNi[j] = LN[j] + 1 to indicate that site Sj has an outstanding request.
    //      - After above updation, if the Queue Q is non-empty, it pops a site ID from the Q and sends 
    //        the token to site indicated by popped ID.
    //      - If the queue Q is empty, it keeps the token
    //      */
        const localSequenceNumber = this.requestSequenceNumbers.get(peer)
        if (localSequenceNumber !== undefined){
            // update sequence array of the token -> sets LN[i] = RNi[i]
            this.token.updateSequenceNumber(peer, localSequenceNumber)

            this.requestSequenceNumbers.forEach((num, peer) => {
                // if this peer does now exist in the queue
                if (!this.token.lookupQueue(peer)){
                    // and, if RN[j] === LN[j] + 1
                    let outstandingSqncNum = this.token.getSequenceNumber(peer) 
                    if (outstandingSqncNum !== undefined){
                        outstandingSqncNum = outstandingSqncNum + 1
                        if (num === outstandingSqncNum){
                            this.token.appendToQueue(peer)
                        }
                    }
                }
               
            })
        
            // if the Queue Q is non-empty, it pops a site ID from the Q and sends 
            // the token to site indicated by popped ID
            if (this.token.queueSize() >= 0){
                console.info("Popping token queue - " , this.token.printTokenData())
                nextTokenPeer = this.token.popFromQueue()  
                console.info("After poppinng token queue - " , this.token.printTokenData())

            }
            // else, we keep the token with this client
        }
        return nextTokenPeer
    }

    public nextPeer() : PeerId | undefined {
        if (this.token.queueSize() >= 0){
            console.info("Popping token queue - " , this.token.printTokenData())
            const nextTokenPeer = this.token.popFromQueue()  
            console.info("After poppinng token queue - " , this.token.printTokenData())
            return nextTokenPeer
        }
    }

    public printMutexObject(){
        console.info("************* MUTEX OBJECT ****************")
        console.info("Local request sequence numbers-")
        this.requestSequenceNumbers.forEach(e => {
            console.info("  " + e)
        })
        this.token.printTokenData()
        console.info("*******************************************")
    }

    // // this method increments the local sequence number value for a specific peer
    // // by 1. It returns the incremented value
    public accessCriticalSection(peer : PeerId | undefined): number {
        if (peer === undefined) {
            console.log("peer is underfined")
            return -1
        }
        let rni = this.requestSequenceNumbers.get(peer)
        if (rni !==  undefined){
            rni = rni + 1
            this.requestSequenceNumbers.set(peer, rni)
            console.info("Sending request with sequence number - ", rni)
            return rni
        }
        console.log("returning -1")
        return -1
    }

    public updateSequenceNumber(peer: PeerId, sqncNum: number) {
        const currentNum = this.requestSequenceNumbers.get(peer)
        if (currentNum !== undefined && currentNum < sqncNum){
                this.requestSequenceNumbers.set(peer, sqncNum)
        }
    }

    // this method compares the sequence number of a peer with the currently existing
    // sequence number in the local array, to filter outdated requests
    // on a valid check, it sets the local token to null and returns the actual token
    // on an invalid check, it returns undefined to indicated outdated request
    public compareSequenceNumber(peer: PeerId, sqncNum: number): IToken | undefined{
        console.info("number in request - ", sqncNum)
        let localSequenceNumber = this.requestSequenceNumbers.get(peer)
        console.info("Before comparing: local request array "+localSequenceNumber);
        let currentExecutionNum = this.token.getSequenceNumber(peer)
        console.log("Before comparing: currentExecutionNum " + currentExecutionNum);
        if (localSequenceNumber === undefined) localSequenceNumber = -1
        if (currentExecutionNum === undefined) currentExecutionNum = -1

        typeof(localSequenceNumber)

        if (localSequenceNumber !== -1 && currentExecutionNum !== -1){
            if (localSequenceNumber < sqncNum){
                
                //updating own local request array
                this.requestSequenceNumbers.set(peer, sqncNum)
                //console.log("After condition: local request array "+this.requestSequenceNumbers.get(peer));

                //Checking the second condition RNj[i] = LN[i] + 1
                if(this.requestSequenceNumbers.get(peer) === currentExecutionNum + 1){

                    console.info("Sending token to client")
                   // send token to requesting client
                    return this.getTokenObjectToSendToPeer()
                }
                
            } else{
                console.info("Invalid return1 ")
                return undefined
            }
        }
        console.info("Invalid return 2")
    }

    public pushRequestTotokenQ(peer: PeerId) {
        this.token.appendToQueue(peer)
    }
}