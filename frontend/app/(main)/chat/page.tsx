"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link"; // Đảm bảo có import này để không lỗi thẻ Link

interface Message {
  id?: number;
  sender_id: number | "AI"; 
  content: string;
  tours?: any[];
  timestamp?: string;
}

interface ChatPartner {
  id: number;
  name: string;
  role: string;
  lastMessage?: string;
}

export default function CustomerChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"AI" | number>("AI");
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMsg, setInputMsg] = useState("");
  const [partners, setPartners] = useState<ChatPartner[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const initAIChat = useCallback((name: string) => {
    setMessages([{ sender_id: "AI", content: `Xin chào ${name}!\nTôi là trợ lý AI.` }]);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("user_id");
    const userName = localStorage.getItem("user_name");
    if (!token || !userId) { router.push("/login"); return; }

    const uid = parseInt(userId);
    setCurrentUser({ id: uid, name: userName });

    const newSocket = io("http://localhost:5000");
    newSocket.on("connect", () => {
      newSocket.emit("join", { room: `user_${uid}` });
    });
    setSocket(newSocket);

    axios.get("http://localhost:5000/api/chat/partners", { 
      headers: { Authorization: `Bearer ${token}` } 
    }).then(res => setPartners(res.data)).catch(console.error);

    const pId = searchParams.get("partnerId");
    if (pId) setActiveTab(parseInt(pId));
    else initAIChat(userName || "Bạn");

    return () => { newSocket.disconnect(); };
  }, [router, searchParams, initAIChat]);

  useEffect(() => {
    if (!socket) return;

    socket.on("receive_message", (data: any) => {
      if (Number(data.sender_id) === Number(activeTab) || Number(data.sender_id) === Number(currentUser?.id)) {
        setMessages(prev => {
          const isExist = prev.find(m => m.id === data.id);
          if (isExist) return prev;
          return [...prev, data];
        });
      }
    });

    return () => { socket.off("receive_message"); };
  }, [socket, activeTab, currentUser]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (activeTab === "AI") {
      if (currentUser) initAIChat(currentUser.name);
    } else {
      const loadHistory = async () => {
        const token = localStorage.getItem("token");
        try {
          const res = await axios.get(`http://localhost:5000/api/chat/messages/${activeTab}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setMessages(res.data);
        } catch (err) { console.error(err); }
      };
      loadHistory();
    }
  }, [activeTab, currentUser, initAIChat]);

  const handleSend = async () => {
    if (!inputMsg.trim() || !currentUser) return;
    const msgContent = inputMsg;
    const token = localStorage.getItem("token");
    setInputMsg("");

    // Optimistic Update
    const myMsg: Message = { sender_id: currentUser.id, content: msgContent };
    setMessages(prev => [...prev, myMsg]);

    if (activeTab === "AI") {
      try {
        const res = await axios.post("http://localhost:5000/api/chat/ai", { message: msgContent, user_id: currentUser.id });
        setMessages(prev => [...prev, { sender_id: "AI", content: res.data.reply, tours: res.data.suggested_tours }]);
      } catch {
        setMessages(prev => [...prev, { sender_id: "AI", content: "Lỗi kết nối AI" }]);
      }
    } else {
      try {
        await axios.post("http://localhost:5000/api/chat/send", {
          receiver_id: activeTab, content: msgContent
        }, { headers: { Authorization: `Bearer ${token}` } });
      } catch (err) { console.error(err); }
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 h-[calc(100vh-80px)]">
      <div className="flex h-full bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        
        {/* SIDEBAR */}
        <div className="w-1/4 bg-gray-50 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200 font-bold text-gray-700">Hộp thoại</div>
          <div className="flex-1 overflow-y-auto">
            <div 
              onClick={() => setActiveTab("AI")}
              className={`p-4 cursor-pointer flex items-center gap-3 transition ${activeTab === "AI" ? "bg-emerald-100 border-l-4 border-emerald-500" : "hover:bg-emerald-50"}`}
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold">AI</div>
              <div>
                <p className="font-bold text-gray-800">Trợ lý AI</p>
                <p className="text-xs text-gray-500">Tư vấn tự động</p>
              </div>
            </div>

            <div className="p-2 text-xs font-bold text-gray-400 uppercase mt-2 ml-2">Hướng dẫn viên</div>
            {partners.map(p => (
              <div 
                key={p.id}
                onClick={() => setActiveTab(p.id)}
                className={`p-4 cursor-pointer flex items-center gap-3 transition ${activeTab === p.id ? "bg-white border-l-4 border-blue-500 shadow-sm" : "hover:bg-gray-100"}`}
              >
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                  {p.name.charAt(0)}
                </div>
                <div className="overflow-hidden">
                  <p className="font-bold text-gray-800 truncate">{p.name}</p>
                  <p className="text-xs text-gray-500 truncate">{p.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CHAT AREA */}
        <div className="w-3/4 flex flex-col">
          <div className="p-4 border-b border-gray-200 bg-white flex items-center gap-3 shadow-sm z-10">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${activeTab === "AI" ? "bg-emerald-500" : "bg-blue-500"}`}>
              {activeTab === "AI" ? "AI" : partners.find(p => p.id === activeTab)?.name.charAt(0)}
            </div>
            <div>
              <h2 className="font-bold text-lg text-gray-800">
                {activeTab === "AI" ? "Trợ lý ảo thông minh" : partners.find(p => p.id === activeTab)?.name}
              </h2>
              <p className={`text-xs ${activeTab === "AI" ? "text-emerald-600" : "text-blue-600"}`}>● Đang hoạt động</p>
            </div>
          </div>

          <div className="flex-1 p-6 overflow-y-auto bg-[#f0f2f5] space-y-4">
            {messages.map((msg, idx) => {
              // LOGIC QUAN TRỌNG: Xác định ai gửi để áp CSS
              const isMe = msg.sender_id === currentUser?.id;
              const isAI = msg.sender_id === "AI";

              return (
                <div key={idx} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                  <div className={`flex ${isMe ? "justify-end" : "justify-start"} w-full`}>
                    {!isMe && (
                      <div className={`w-8 h-8 rounded-full mr-2 flex items-center justify-center text-[10px] text-white ${isAI ? "bg-emerald-500" : "bg-blue-500"}`}>
                        {isAI ? "AI" : "HDV"}
                      </div>
                    )}
                    <div className={`max-w-[75%] p-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
                      isMe ? "bg-blue-600 text-white rounded-br-none" : "bg-white border border-gray-200 text-gray-800 rounded-bl-none"
                    }`}>
                      {msg.content} {/* Đổi từ msg.text thành msg.content */}
                    </div>
                  </div>

                  {msg.tours && msg.tours.length > 0 && (
                    <div className="mt-2 ml-10 flex gap-3 overflow-x-auto max-w-full pb-2">
                      {msg.tours.map((tour: any) => (
                        <div key={tour.id} className="min-w-[200px] bg-white rounded-xl border border-emerald-200 shadow-md overflow-hidden flex flex-col">
                          <img 
                            src={tour.image ? `http://localhost:5000/static/uploads/${tour.image}` : "https://via.placeholder.com/200x100"} 
                            alt={tour.name} 
                            className="h-24 w-full object-cover"
                          />
                          <div className="p-3 flex flex-col flex-1">
                            <h4 className="font-bold text-gray-800 text-xs line-clamp-2 mb-1">{tour.name}</h4>
                            <p className="text-red-600 font-bold text-sm mb-2">{tour.price?.toLocaleString()} đ</p>
                            <Link href={`/tours/${tour.id}`} className="mt-auto block w-full text-center bg-emerald-600 text-white text-xs font-bold py-2 rounded-lg hover:bg-emerald-700 transition">
                              Xem & Đặt ngay
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={scrollRef} />
          </div>

          <div className="p-4 bg-white border-t border-gray-200">
            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
              <input
                type="text"
                placeholder={activeTab === "AI" ? "Hỏi AI về tour..." : "Nhắn tin..."}
                className="flex-1 p-3 bg-gray-100 rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none"
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
              />
              <button type="submit" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition">
                Gửi
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}