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

  public getRoomPeers = (key: string, peerId: string): string[] => {
    let peers = this.rooms.get(key);
    this.users.set(peerId, key);

    if (peers === undefined) {
      peers = new Set();
      this.rooms.set(key, peers);
    }

    const data = Array.from(peers);
    peers.add(peerId);
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
