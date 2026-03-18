import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:5000";

export const socket = io(SOCKET_URL, {
  transports: ["websocket"],
  autoConnect: true, // Tự động kết nối
  reconnection: true, // Tự động kết nối lại nếu mất mạng
});