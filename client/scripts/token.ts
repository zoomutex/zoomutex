
interface ITokenQueue {
    queue: string[]
    queueSize: number;
}

/*
* TokenQueue represents the queue maintained within the token
*/
class TokenQueue implements ITokenQueue {
    queue : string[] = [];
    queueSize: number

    constructor(numPeers : number){
        this.queueSize = numPeers
        this.queue = []
    }
    // Enque an object to the queue
    enq(object: string): boolean {
        if (this.queue.length === this.queueSize) {
            return false
        }
        this.queue.push(object)
        return true
    }
    //Deque an object from the queue
    deq(): string | undefined {
        return this.queue.pop()
    }
    size(): number{
        return this.queue.length
    }
    isElement(object: string): boolean{
        for (const el in this.queue){
            if (JSON.stringify(this.queue[el]) === JSON.stringify(object)){
                return true
            }
        }
        return false
    }
}

export interface IToken {
     peerCount: number
     tokenQ: ITokenQueue
     executedSequenceNumbers: Array<[string, number]>
}


export default class Token {

    peerCount : number
    // the queue maintained by the token
    tokenQ : TokenQueue // Q
    // a representation of the array of sequence number of the request that is recently executed by site
    executedSequenceNumbers: Map<string, number> // LN[i]

    // takes the list of all peers associated with this token and initialises 
    // the array of sequence numbers of the recently executed sites to 0
    constructor(peers : string[]){
        this.peerCount = peers.length
        this.tokenQ = new TokenQueue(this.peerCount)
        this.executedSequenceNumbers = new Map<string, number>()

        peers.forEach(peer => {
            this.executedSequenceNumbers.set(peer, 0)
        });
    }

    public toIToken(): IToken {
        return {
            peerCount: this.peerCount,
            tokenQ: this.tokenQ,
            executedSequenceNumbers: [...this.executedSequenceNumbers.entries()]
        }    
    }

    /**
     * appendToQueue pushes the supplied peerId to the token's queue
     */
    public appendToQueue(peer: string): boolean {
        return this.tokenQ.enq(peer)
    }
    /**
     * pop from returns the first element from the token's queue
     */
    public popFromQueue(): string | undefined {
        return this.tokenQ.deq()
    }

    /**
     * lookupQueer: looks up the token's queue and returns boolean to 
     * indicate presence or absence
     */
    public lookupQueue(peer: string) : boolean{
        return this.tokenQ.isElement(peer)
    }

    public queueSize() : number{
        return this.tokenQ.size()
    }

    public updateSequenceNumber(peer: string, sqncNum: number) :boolean {
        const currentSequenceNumber = this.executedSequenceNumbers.get(peer)
        if (currentSequenceNumber !== undefined){
            this.executedSequenceNumbers.set(peer, sqncNum)
            return true
        }
        return false
    }

    
    public getSequenceNumber(peer: string) : number | undefined{
        return this.executedSequenceNumbers.get(peer)
    }

    public printTokenData() {
        console.info("-------------- TOKEN --------------")
        console.info("Token queue size : " , this.tokenQ.size())
        console.info("Token sequence numbers map : ")
        this.executedSequenceNumbers.forEach(element => {
            console.info(element)
        });
        console.info("------------------------------------")
    }

}   
 

