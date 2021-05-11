import Token, { IToken } from "./token.js";

type PeerId = string;

export default class Mutex {
  private token: Token;

  /**
   * RN[i]
   */
  private requestSequenceNumbers: Map<PeerId, number>;

  constructor(peers: PeerId[], self: PeerId) {
    // on initialisation, we delegate the token to the first peer in the array
    // every other peer will have an empty token
    if (self === peers[0]) {
      //console.log("This user has the token");
      this.token = new Token(peers);
    } else {
      //console.log("This user does not have the token");
      this.token = new Token([]);
    }

    this.requestSequenceNumbers = new Map<PeerId, number>();

    for (const p of peers) {
      // every peer starts at 0
      this.requestSequenceNumbers.set(p, 0);
    }
  }

  /**
   * Sets the current token object as empty, and returns the current token
   * object.
   * @returns Current token object, which can be sent to another peer.
   */
  public getTokenObject(): IToken {
    const token = this.token.toIToken();
    this.removeToken();
    return token;
  }

  /**
   * Sets the current token object to the one provided.
   * @param token
   */
  public setTokenObject(token: IToken) {
    console.info("I now have the token");

    // Copy the token contents
    this.token.peerCount = token.peerCount;
    this.token.queue.queue = token.tokenQueue.queue;
    this.token.queue.queueSize = token.tokenQueue.queueSize;
    this.token.executedSequenceNumbers = new Map<string, number>();

    for (const [key, val] of token.executedSequenceNumbers) {
      this.token.executedSequenceNumbers.set(key, val);
    }
  }

  /**
   * Check to see if I currently have the token
   */
  public doIHaveToken(): boolean {
    return this.token.peerCount >= 1;
  }

  /**
   * Called when the client has passed the token to another client.
   */
  public removeToken() {
    console.info("I no longer have the token");
    this.token = new Token([]);
  }

  /**
   * Called when this client has completed execution of the critical section.
   * After all checks, it returns the `Peer` object that is next in queue for
   * the token, or null if the queue is empty.
   * @param peer
   * @returns
   */
  public releaseCriticalSection(peer: PeerId | undefined): PeerId | undefined {
    if (peer === undefined) {
      return undefined;
    }

    let nextTokenPeer: PeerId | undefined = undefined;

    /**
     * Algorithm: update token object
     * - sets LN[i] = RNi[i] to indicate that its critical section request RNi[i] has been executed
     * - For every site Sj, whose ID is not present in the token queue Q, it appends its ID to Q if
     *   RNi[j] = LN[j] + 1 to indicate that site Sj has an outstanding request.
     * - After above updation, if the Queue Q is non-empty, it pops a site ID from the Q and sends
     *   the token to site indicated by popped ID.
     * - If the queue Q is empty, it keeps the token
     */
    const localSequenceNumber = this.requestSequenceNumbers.get(peer);
    if (localSequenceNumber === undefined) {
      return nextTokenPeer;
    }

    // update sequence array of the token -> sets LN[i] = RNi[i]
    this.token.updateSequenceNumber(peer, localSequenceNumber);

    this.requestSequenceNumbers.forEach((num, peer) => {
      // if this peer does now exist in the queue
      if (!this.token.lookupQueue(peer)) {
        // and, if RN[j] === LN[j] + 1
        let outstandingSqncNum = this.token.getSequenceNumber(peer);
        if (outstandingSqncNum !== undefined) {
          outstandingSqncNum = outstandingSqncNum + 1;
          if (num === outstandingSqncNum) {
            this.token.appendToQueue(peer);
          }
        }
      }
    });

    // if the Queue Q is non-empty, it pops a site ID from the Q and sends
    // the token to site indicated by popped ID
    if (this.token.queueSize() >= 0) {
     // console.info("Popping token queue - ", this.token.printTokenData());
      nextTokenPeer = this.token.popFromQueue();
     // console.info(
       // `After popping token queue - ${this.token.printTokenData()}`
      //);
    }

    // else, we keep the token with this client
    return nextTokenPeer;
  }

  public nextPeer(): PeerId | undefined {
    if (this.token.queueSize() >= 0) {
     // console.info(`Popping token queue - ${this.token.printTokenData()}`);
      let nextTokenPeer = this.token.popFromQueue();
      
      return nextTokenPeer;
    }
  }

  public printMutexObject() {
   // console.info("************* MUTEX OBJECT ****************");
    const seqNumbers: number[] = [];
    this.requestSequenceNumbers.forEach((e) => {
      seqNumbers.push(e);
    });

    //console.info(`Local request sequence numbers ${seqNumbers.join(" ")}`);

    this.token.printTokenData();
    //console.info("*******************************************");
  }

  /**
   * Increment the local sequence number for a specific peer, by 1.
   * @param peer
   * @returns The incremented value.
   */
  public accessCriticalSection(peer: PeerId | undefined): number {
    if (peer === undefined) {
      console.log("peer is underfined");
      return -1;
    }
    let rni = this.requestSequenceNumbers.get(peer);
    if (rni !== undefined) {
      rni = rni + 1;
      this.requestSequenceNumbers.set(peer, rni);
     // console.info(`Sending request with sequence number - ${rni}`);
      return rni;
    }
    return -1;
  }

  public updateSequenceNumber(peer: PeerId, sqncNum: number) {
    const currentNum = this.requestSequenceNumbers.get(peer);
    if (currentNum !== undefined && currentNum < sqncNum) {
      this.requestSequenceNumbers.set(peer, sqncNum);
    }
  }

  /**
   * Compares the sequence number of a peer with the currently existing
   * sequence number in the local array.
   *
   * To filter outdated requests on a valid check, it sets the local token to
   * `null` and returns the actual token on an invalid check.
   *
   * It returns undefined to indicate an outdated request.
   * @param peerId
   * @param seqNum
   * @returns
   */
  public compareSequenceNumber(
    peerId: PeerId,
    seqNum: number
  ): IToken | undefined {
    //console.info(`number in request - ${seqNum}`);
    let localSequenceNumber = this.requestSequenceNumbers.get(peerId);

   
    let currentExecutionNum = this.token.getSequenceNumber(peerId);

    if (localSequenceNumber === undefined) {
      console.error(`Could not find localSequenceNumber for peer ${peerId}`);
      return;
    }

    if (currentExecutionNum === undefined) {
      console.error(`Could not find currentExecutionNum for peer ${peerId}`);
      return;
    }

    if (localSequenceNumber >= seqNum) {
      console.error(
        `localSequenceNumber (${localSequenceNumber}) >= seqNum (${seqNum})`
      );
      return;
    }

    // localSequenceNumber < seqNum
    // updating own local request array
    this.requestSequenceNumbers.set(peerId, seqNum);

    //Checking the second condition RNj[i] = LN[i] + 1
    if (this.requestSequenceNumbers.get(peerId) === currentExecutionNum + 1) {
      console.info("Sending token to client");
      // send token to requesting client
      return this.getTokenObject();
    }
  }

  public appendToTokenQueue(peer: PeerId) {
    this.token.appendToQueue(peer);
  }
}
