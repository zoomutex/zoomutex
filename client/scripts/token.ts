
//type peerPlaceHolder = Peer
type peerPlaceHolder = string


interface ItokenQueue<T> {
    enq(siteId: T): boolean,
    deq() : T | undefined,
    size(): number
}

/*
* TokenQueue represents the queue maintained within the token
*/
class TokenQueue<T> implements ItokenQueue<T> {
    private queue : T[] = [];
    private queueSize: number
    constructor(numPeers : number){
        this.queueSize = numPeers
        this.queue = new Array()
    }
    // Enque an object to the queue
    enq(object: T): boolean {
        if (this.queue.length == this.queueSize) {
            return false
        }
        this.queue.push(object)
        return true
    }
    //Deque an object from the queue
    deq(): T | undefined {
        return this.queue.shift()
    }
    size(): number{
        return this.queue.length
    }
}


export default class Token {

    readonly peerCount : number
    // the queue maintained by the token
    private readonly tokenQ : TokenQueue<peerPlaceHolder> // Q
    // a representation of the array of sequence number of the request that is recently executed by site
    private readonly executedSequenceNumbers: Map<peerPlaceHolder, number> // LN[i]

    // takes the list of all peers associated with this token and initialises 
    // the array of sequence numbers of the recently executed sites to 0
    constructor(peers : peerPlaceHolder[]){
        this.peerCount = peers.length
        this.tokenQ = new TokenQueue<peerPlaceHolder>(this.peerCount)
        this.executedSequenceNumbers = new Map<peerPlaceHolder, number>()

        peers.forEach(peer => {
            this.executedSequenceNumbers.set(peer, 0)
        });
    }
    /**
     * appendToQueue pushes the supplied peerId to the token's queue
     */
    public appendToQueue(peer: peerPlaceHolder): boolean {
        return this.tokenQ.enq(peer)
    }
    /**
     * pop from returns the first element from the token's queue
     */
    public popFromQueue(): peerPlaceHolder | undefined {
        return this.tokenQ.deq()
    }
    public queueSize() : number{
        return this.tokenQ.size()
    }


    public actionPlaceholder() {
        console.log("**************TOKEN*************")
        console.log("Token queue size : " , this.tokenQ.size())
        console.log("executedSequenceNumbers map : ")
        this.executedSequenceNumbers.forEach(element => {
            console.log(element)
        });
        console.log("*******************************")
        console.log("")
    }

}   
 

