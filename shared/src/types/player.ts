export interface Player {
  id: string;
  socketId: string;
  name: string;
  isHost: boolean;
  isConnected: boolean;
  isReady: boolean;
}

export interface PlayerPublicInfo {
  id: string;
  name: string;
  isHost: boolean;
  isConnected: boolean;
}
