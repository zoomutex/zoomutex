export default class Rooms {
  private static instance: Rooms | null = null;

  public static init = (): Rooms => {
    if (Rooms.instance === null) {
      Rooms.instance = new Rooms();
    }

    return Rooms.instance;
  };

  /**
   * Map of roomId to user ids
   */
  private readonly rooms = new Map<string, Set<string>>();

  /**
   * Map of user id to room id
   */
  private readonly users = new Map<string, string>();

  private constructor() {}

  /**
   * Gets the peers of the current room. If the current room does not exist
   * then the room is created.
   *
   * @param roomId
   * @param peerId
   * @returns
   */
  public getRoomPeers = (roomId: string, peerId: string): ReadonlyArray<string> => {
    let peers = this.rooms.get(roomId);
    this.users.set(peerId, roomId);

    if (peers === undefined) {
      peers = new Set();
      this.rooms.set(roomId, peers);
    }

    // Get all the peers
    const data: ReadonlyArray<string>  = Array.from(peers);

    // Add yourself to the room.
    peers.add(peerId);

    // `data` does not contain yourself - it contains all the existing peers.
    return data;
  };

  public onPeerDisconnect = (peerId: string): void => {
    const roomId = this.users.get(peerId);
    this.users.delete(peerId);

    if (roomId === undefined) {
      return;
    }

    let peers = this.rooms.get(roomId);
    if (peers === undefined) {
      return;
    }

    peers.delete(peerId);
    if (peers.size === 0) {
      this.rooms.delete(roomId);
    }
  };
}
