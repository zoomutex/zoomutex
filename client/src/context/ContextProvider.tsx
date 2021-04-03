import { PeerContext, peer } from "./PeerContext";
import { SocketContext, socket } from "./SocketContext";

export interface ContextProviderProps {
  children: JSX.Element;
}

export const ContextProvider = ({
  children,
}: ContextProviderProps): JSX.Element => {
  return (
    <SocketContext.Provider value={socket}>
      <PeerContext.Provider value={peer}>{children}</PeerContext.Provider>
    </SocketContext.Provider>
  );
};
