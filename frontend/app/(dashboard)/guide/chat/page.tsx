"use client";
import React, { useEffect, useState, useRef, Suspense } from "react";
import { io, Socket } from "socket.io-client";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";

function GuideChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<number | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMsg, setInputMsg] = useState("");
  const [partners, setPartners] = useState<any[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("user_id");
    if (!token || !userId) { router.push("/login"); return; }

    const uid = parseInt(userId);
    setCurrentUser({ id: uid });

    if (!socketRef.current) {
      socketRef.current = io("http://localhost:5000");
      socketRef.current.on("connect", () => {
        socketRef.current?.emit("join", { room: `user_${uid}` });
      });
    }

    axios.get("http://localhost:5000/api/chat/partners", { 
      headers: { Authorization: `Bearer ${token}` } 
    }).then(res => {
        // CAN THIỆP: Lọc bỏ chính mình khỏi danh sách bên trái
        const filtered = res.data.filter((p: any) => Number(p.id) !== uid);
        setPartners(filtered);
        const pId = searchParams.get("partnerId");
        if (pId) setActiveTab(parseInt(pId));
        else if (filtered.length > 0) setActiveTab(filtered[0].id);
    }).catch(console.error);

    return () => { socketRef.current?.disconnect(); socketRef.current = null; };
  }, [router, searchParams]);

  useEffect(() => {
    if (!socketRef.current || !activeTab) return;
    const handleReceive = (data: any) => {
      const myId = Number(localStorage.getItem("user_id"));
      if (Number(data.sender_id) === myId) return; // Chặn tự nhắn

      if (Number(data.sender_id) === Number(activeTab)) {
        setMessages(prev => {
          if (data.id && prev.some(m => m.id === data.id)) return prev;
          return [...prev, data];
        });
      }
    };
    socketRef.current.on("receive_message", handleReceive);
    return () => { socketRef.current?.off("receive_message", handleReceive); };
  }, [activeTab]);

  useEffect(() => {
    if (!activeTab) return;
    axios.get(`http://localhost:5000/api/chat/messages/${activeTab}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    }).then(res => setMessages(res.data));
  }, [activeTab]);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = async () => {
    if (!inputMsg.trim() || !activeTab || !currentUser) return;
    const content = inputMsg;
    setInputMsg("");
    setMessages(prev => [...prev, { sender_id: currentUser.id, content }]);

    await axios.post("http://localhost:5000/api/chat/send", { receiver_id: activeTab, content }, 
    { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
  };

  return (
    <div className="max-w-6xl mx-auto p-6 h-[calc(100vh-80px)]">
      <div className="flex h-full bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        {/* SIDEBAR */}
        <div className="w-1/4 bg-gray-50 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200 font-bold text-gray-700">Hộp thoại hỗ trợ</div>
          <div className="flex-1 overflow-y-auto">
            {partners.map(p => (
              <div key={p.id} onClick={() => setActiveTab(p.id)} className={`p-4 cursor-pointer flex items-center gap-3 transition ${activeTab === p.id ? "bg-white border-l-4 border-blue-500 shadow-sm" : "hover:bg-gray-100"}`}>
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">{p.name[0].toUpperCase()}</div>
                <div className="overflow-hidden flex-1"><p className="font-bold text-gray-800 truncate">{p.name}</p><p className="text-[11px] text-gray-500 truncate italic">Khách hàng</p></div>
              </div>
            ))}
          </div>
        </div>
        {/* CHAT AREA */}
        <div className="flex-1 flex flex-col bg-[#f0f2f5]">
          <div className="p-4 border-b border-gray-200 bg-white flex items-center gap-3 shadow-sm z-10">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm bg-blue-500">
              {partners.find(p => p.id === activeTab)?.name[0] || "?"}
            </div>
            <div>
              <h2 className="font-bold text-lg text-gray-800">{partners.find(p => p.id === activeTab)?.name}</h2>
              <p className="text-xs flex items-center gap-1 font-medium text-blue-600"><span className="w-2 h-2 bg-current rounded-full animate-pulse"></span>Đang hỗ trợ khách hàng</p>
            </div>
          </div>
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {messages.map((msg, idx) => {
              const isMe = Number(msg.sender_id) === Number(currentUser?.id);
              return (
                <div key={idx} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                  <div className={`flex ${isMe ? "justify-end" : "justify-start"} w-full`}>
                    {!isMe && <div className="w-8 h-8 rounded-full mr-2 flex items-center justify-center text-[10px] text-white shadow-sm bg-gray-500">KH</div>}
                    <div className={`max-w-[75%] p-3 rounded-2xl text-[14px] leading-relaxed shadow-sm ${isMe ? "bg-blue-600 text-white rounded-br-none" : "bg-white border border-gray-200 text-gray-800 rounded-bl-none"}`}>{msg.content}</div>
                  </div>
                </div>
              );
            })}
            <div ref={scrollRef} />
          </div>
          <div className="p-4 bg-white border-t border-gray-200">
            <form onSubmit={e => { e.preventDefault(); handleSend(); }} className="flex gap-2">
              <input type="text" className="flex-1 p-3 bg-gray-100 rounded-2xl outline-none focus:ring-2 ring-blue-500" value={inputMsg} onChange={e => setInputMsg(e.target.value)} placeholder="Nhập câu trả lời..." />
              <button type="submit" className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold">Gửi</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GuideChatPage() {
  return <Suspense fallback={<div className="p-10 text-center">Đang tải...</div>}><GuideChatContent /></Suspense>;
}