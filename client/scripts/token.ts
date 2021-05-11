interface ITokenQueue {
  queue: string[];
  queueSize: number;
}

/*
 * TokenQueue represents the queue maintained within the token
 */
class TokenQueue implements ITokenQueue {
  queue: string[] = [];
  queueSize: number;

  constructor(numPeers: number) {
    this.queueSize = numPeers;
    this.queue = new Array();
  }

  /**
   * Enqueue an on object to the queue
   * @param object
   * @returns
   */
  public enq(object: string): boolean {
    if (this.queue.length === this.queueSize) {
      return false;
    }
    this.queue.push(object);
    return true;
  }

  /**
   * Dequeue an object from the queue
   * @returns
   */
  public deq(): string | undefined {
    return this.queue.pop();
  }

  /**
   * Get the size of the queue
   * @returns
   */
  public size(): number {
    return this.queue.length;
  }

  /**
   * Checks to see if the object is contained
   * @param object
   * @returns
   */
  public contains(object: string): boolean {
    for (const el in this.queue) {
      if (JSON.stringify(this.queue[el]) === JSON.stringify(object)) {
        return true;
      }
    }
    return false;
  }
}

export interface IToken {
  peerCount: number;
  tokenQueue: ITokenQueue;
  executedSequenceNumbers: Array<[string, number]>;
}

export default class Token {
  peerCount: number;

  /**
   * The queue maintained by the token
   */
  queue: TokenQueue;

  /**
   * Representation of the array of sequence numbers from the request that has
   * recently been executed.
   */
  executedSequenceNumbers: Map<string, number>; // LN[i]

  /**
   * Takes the list of all peers associated with this token and initialises the
   * array of sequence numbers of the recently executed sites to 0.
   * @param peers
   */
  constructor(peers: string[]) {
    this.peerCount = peers.length;
    this.queue = new TokenQueue(this.peerCount);
    this.executedSequenceNumbers = new Map<string, number>();

    for (const peerId of peers) {
      this.executedSequenceNumbers.set(peerId, 0);
    }
  }

  public toIToken(): IToken {
    return {
      peerCount: this.peerCount,
      tokenQueue: this.queue,
      executedSequenceNumbers: [...this.executedSequenceNumbers.entries()],
    };
  }

  /**
   * Appends the supplied peerId to the token's queue.
   */
  public appendToQueue(peer: string): boolean {
    return this.queue.enq(peer);
  }
  /**
   * Pops from returns the first element from the token's queue.
   */
  public popFromQueue(): string | undefined {
    return this.queue.deq();
  }

  /**
   * Looks up the token's queue and returns a Boolean to indicate presence or
   * absence
   */
  public lookupQueue(peer: string): boolean {
    return this.queue.contains(peer);
  }

  public queueSize(): number {
    return this.queue.size();
  }

  public updateSequenceNumber(peer: string, sqncNum: number): boolean {
    let currentSequenceNumber = this.executedSequenceNumbers.get(peer);
    if (currentSequenceNumber !== undefined) {
      this.executedSequenceNumbers.set(peer, sqncNum);
      return true;
    }
    return false;
  }

  public getSequenceNumber(peer: string): number | undefined {
    return this.executedSequenceNumbers.get(peer);
  }

  public printTokenData() {
    const seqNumbers: number[] = [];
    this.executedSequenceNumbers.forEach((element) => {
      seqNumbers.push(element);
    });
  }
}
