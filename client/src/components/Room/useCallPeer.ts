import { useCallback, useState } from "react";

import Peer from "peerjs";
import { Streams } from "./VideoList";

type UseCallPeer = [(userId: string) => void, Streams];

export function useCallPeer(
  peerjs: Peer,
  userMediaStream: MediaStream | null
): UseCallPeer {
  const [streams, setStreams] = useState<Streams>({});

  const callPeer = useCallback(
    (userId: string): void => {
      if (userId === undefined) {
        console.error("userId was undefined");
        return;
      }

      if (userMediaStream === null) {
        console.error("userMediaStream was null");
        return;
      }

      const call = peerjs.call(userId, userMediaStream);

      // Register event handlers

      call.on("stream", (stream) => {
        // When we receive a new stream, add it to streams
        setStreams((streams) => ({ ...streams, [userId]: stream }));
      });

      call.on("close", () => {
        // When this call closes, remove the stream
        setStreams((streams) => {
          const { [userId]: omitted, ...rest } = streams;
          return { ...rest };
        });
      });
    },
    [peerjs, userMediaStream]
  );

  return [callPeer, streams];
}
