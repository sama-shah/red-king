import { createContext, useContext, useEffect, ReactNode } from 'react';
import { socket, TypedSocket } from '../socket';

const SocketContext = createContext<TypedSocket>(socket);

export function SocketProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    socket.connect();
    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket(): TypedSocket {
  return useContext(SocketContext);
}
