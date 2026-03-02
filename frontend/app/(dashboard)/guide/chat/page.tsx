"use client";
import React, { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function GuideChatPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<number | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMsg, setInputMsg] = useState("");
  const [partners, setPartners] = useState<any[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("user_id");
    if (!token || !userId) { router.push("/login"); return; }

    const uid = parseInt(userId);
    setCurrentUser({ id: uid });

    const newSocket = io("http://localhost:5000");
    newSocket.on("connect", () => {
        newSocket.emit("join", { room: `user_${uid}` });
    });
    setSocket(newSocket);

    axios.get("http://localhost:5000/api/chat/partners", { 
      headers: { Authorization: `Bearer ${token}` } 
    }).then(res => {
        setPartners(res.data);
        if(res.data.length > 0) setActiveTab(res.data[0].id);
    });

    return () => { newSocket.disconnect(); };
  }, [router]);

  useEffect(() => {
    if (!socket || !activeTab) return;
    socket.on("receive_message", (data: any) => {
      if (activeTab.toString() === data.sender_id.toString()) {
        setMessages(prev => [...prev, data]);
      }
    });
    return () => { socket.off("receive_message"); };
  }, [socket, activeTab]);

  useEffect(() => {
    if (!activeTab) return;
    const loadHistory = async () => {
        const token = localStorage.getItem("token");
        const res = await axios.get(`http://localhost:5000/api/chat/messages/${activeTab}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessages(res.data);
    };
    loadHistory();
  }, [activeTab]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!inputMsg.trim() || !activeTab || !currentUser) return;
    const msgContent = inputMsg;
    setInputMsg("");

    setMessages(prev => [...prev, { sender_id: currentUser.id, content: msgContent }]);

    try {
      const token = localStorage.getItem("token");
      await axios.post("http://localhost:5000/api/chat/send", {
        receiver_id: activeTab, content: msgContent
      }, { headers: { Authorization: `Bearer ${token}` } });
    } catch (err) { console.error(err); }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 h-[calc(100vh-80px)]">
      <div className="flex h-full bg-white rounded-2xl shadow-xl border overflow-hidden">
        <div className="w-1/4 bg-gray-50 border-r flex flex-col">
          <div className="p-4 border-b font-bold">Khách hàng đang chat</div>
          <div className="flex-1 overflow-y-auto">
            {partners.map(p => (
              <div key={p.id} onClick={() => setActiveTab(p.id)} className={`p-4 cursor-pointer flex gap-3 ${activeTab === p.id ? "bg-blue-100" : "hover:bg-gray-100"}`}>
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white">{p.name[0]}</div>
                <div className="overflow-hidden">
                    <p className="font-bold truncate">{p.name}</p>
                    <p className="text-xs text-gray-500 truncate">{p.lastMessage}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="w-3/4 flex flex-col bg-[#f0f2f5]">
          <div className="p-4 bg-white border-b font-bold">
             Chat với: {partners.find(p => p.id === activeTab)?.name || "..."}
          </div>
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {messages.map((msg, idx) => {
              const isMe = msg.sender_id.toString() === currentUser?.id.toString();
              return (
                <div key={idx} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[70%] p-3 rounded-xl shadow-sm ${isMe ? "bg-blue-600 text-white rounded-br-none" : "bg-white text-gray-800 border rounded-bl-none"}`}>
                    {msg.content}
                  </div>
                </div>
              );
            })}
            <div ref={scrollRef} />
          </div>
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="p-4 bg-white border-t flex gap-2">
            <input type="text" className="flex-1 p-2 bg-gray-100 rounded-lg outline-none" value={inputMsg} onChange={e => setInputMsg(e.target.value)} placeholder="Trả lời khách hàng..." />
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg">Gửi</button>
          </form>
        </div>
      </div>
    </div>
  );
}