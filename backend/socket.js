import { io } from "socket.io-client";

let socket;

export const connectSocket = (accessToken) => {
  socket = io({
    auth: {
      token: accessToken
    }
  });

  return socket;
};

export const getSocket = () => socket;
