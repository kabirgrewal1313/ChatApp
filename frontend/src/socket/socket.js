import { io } from "socket.io-client";

let socket;

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:3000";

export const connectSocket = (accessToken) => {
console.log(SOCKET_URL);
  if (!accessToken) throw new Error("Access token required to connect socket");
  
  if (socket && socket.connected) {
    return socket;
  }

  socket = io(import.meta.env.SERVER_IP, {
    auth: {
      token: accessToken
    }
  });

  socket.on("connect", () => {
    console.log("Socket connected:", socket.id);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected");
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

