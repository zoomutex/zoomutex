
//type peerPlaceHolder = Peer
type peerPlaceHolder = string


interface ItokenQueue<T> {
    enq(siteId: T): boolean,
    deq() : T | undefined,
    size(): number
    isElement(object: T): boolean
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
    isElement(object: T): boolean{
        for (let el in this.queue){
            if (JSON.stringify(this.queue[el]) === JSON.stringify(object)){
                return true
            }
        }
        return false
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

    /**
     * lookupQueer: looks up the token's queue and returns boolean to 
     * indicate presence or absence
     */
    public lookupQueue(peer: peerPlaceHolder) : boolean{
        return this.tokenQ.isElement(peer)
    }

    public queueSize() : number{
        return this.tokenQ.size()
    }

    public updateSequenceNumber(peer: peerPlaceHolder, sqncNum: number) :boolean {
        let currentSequenceNumber = this.executedSequenceNumbers.get(peer)
        if (currentSequenceNumber != undefined){
            this.executedSequenceNumbers.set(peer, sqncNum)
            return true
        }
        return false
    }
    public getSequenceNumber(peer: peerPlaceHolder) : number | undefined{
        return this.executedSequenceNumbers.get(peer)
    }

    public printTokenData() {
        console.log("************** TOKEN *************")
        console.log("Token queue size : " , this.tokenQ.size())
        console.log("Token sequence numbers map : ")
        this.executedSequenceNumbers.forEach(element => {
            console.log(element)
        });
        console.log("*******************************")
        console.log("")
    }

}   
 

