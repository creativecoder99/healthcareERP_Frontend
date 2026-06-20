import { io, Socket } from "socket.io-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";
const SOCKET_URL = API_URL.replace("/api/v1", "");

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      withCredentials: true,
      autoConnect: false, // connect manually when user session is active
    });
  }
  return socket;
}

export function connectSocket(userId: string) {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
    s.on("connect", () => {
      console.log("🔌 Connected to WebSocket Server");
      s.emit("join-room", userId);
    });
  }
}

export function disconnectSocket() {
  if (socket && socket.connected) {
    socket.disconnect();
    console.log("🔌 Disconnected from WebSocket Server");
  }
}
