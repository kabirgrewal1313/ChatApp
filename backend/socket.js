import { io } from "socket.io-client";

let socket;

export const connectSocket = (accessToken) => {
  socket = io("http://localhost:3000", {
    auth: {
      token: accessToken
    }
  });

  return socket;
};

export const getSocket = () => socket;
