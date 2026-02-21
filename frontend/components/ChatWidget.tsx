"use client";
import { useEffect, useState } from "react";
import io from "socket.io-client";

let socket;

export default function ChatWidget({ userId, partnerId }) {
  const [msg, setMsg] = useState("");
  const [chatHistory, setChatHistory] = useState([]);

  useEffect(() => {
    // Kết nối Socket
    socket = io("http://localhost:5000");

    // Join room của chính mình để nhận tin nhắn
    socket.emit("join", { room: `user_${userId}` });

    // Lắng nghe tin nhắn đến
    socket.on("receive_message", (data) => {
      setChatHistory((prev) => [...prev, { sender: "partner", text: data.content }]);
    });

    return () => socket.disconnect();
  }, [userId]);

  const sendMsg = () => {
    if (!msg) return;

    // Gửi lên server
    socket.emit("send_message", {
      sender_id: userId,
      receiver_id: partnerId, // ID của HDV hoặc Khách
      content: msg
    });

    // Cập nhật giao diện ngay lập tức
    setChatHistory((prev) => [...prev, { sender: "me", text: msg }]);
    setMsg("");
  };

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-white shadow-xl rounded-xl border border-gray-200 overflow-hidden z-50">
      <div className="bg-emerald-600 p-3 text-white font-bold">Chat Hỗ Trợ</div>
      <div className="h-64 overflow-y-auto p-4 bg-gray-50 space-y-2">
        {chatHistory.map((m, i) => (
          <div key={i} className={`flex ${m.sender === "me" ? "justify-end" : "justify-start"}`}>
            <span className={`px-3 py-1 rounded-lg text-sm ${m.sender === "me" ? "bg-emerald-500 text-white" : "bg-gray-200 text-gray-800"}`}>
              {m.text}
            </span>
          </div>
        ))}
      </div>
      <div className="p-2 border-t flex gap-2">
        <input 
          className="flex-1 border rounded px-2 text-sm outline-none" 
          value={msg} 
          onChange={e => setMsg(e.target.value)}
          placeholder="Nhập tin nhắn..."
          onKeyPress={e => e.key === 'Enter' && sendMsg()}
        />
        <button onClick={sendMsg} className="text-emerald-600 font-bold text-sm">Gửi</button>
      </div>
    </div>
  );
}