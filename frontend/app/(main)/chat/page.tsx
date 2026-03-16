"use client";
import React, { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { io, Socket } from "socket.io-client";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

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
}

function CustomerChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"AI" | number>("AI");
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMsg, setInputMsg] = useState("");
  const [partners, setPartners] = useState<ChatPartner[]>([]);
  const [isTyping, setIsTyping] = useState(false); 
  const socketRef = useRef<Socket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const initAIChat = useCallback((name: string) => {
    setMessages([{ sender_id: "AI", content: `Xin chào ${name}!\nTôi là trợ lý AI. Bạn cần tư vấn tour gì không?` }]);
  }, []);

  const getSessionId = () => localStorage.getItem("user_id") || "guest";

  // 1. Khởi tạo Socket và Load Partners
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("user_id");
    const userName = localStorage.getItem("user_name");
    
    if (!token || !userId) { router.push("/login"); return; }

    const uid = parseInt(userId);
    setCurrentUser({ id: uid, name: userName });

    if (!socketRef.current) {
      socketRef.current = io("http://localhost:5000");
      socketRef.current.on("connect", () => {
        socketRef.current?.emit("join", { room: `user_${uid}` });
      });
    }

    axios.get("http://localhost:5000/api/chat/partners", { 
      headers: { Authorization: `Bearer ${token}` } 
    }).then(res => {
      const filtered = res.data.filter((p: any) => Number(p.id) !== uid);
      setPartners(filtered);
    }).catch(console.error);

    const pId = searchParams.get("partnerId");
    if (pId) setActiveTab(parseInt(pId));

    return () => { socketRef.current?.disconnect(); socketRef.current = null; };
  }, [router, searchParams]);

  // 2. Lắng nghe tin nhắn thời gian thực
  useEffect(() => {
    if (!socketRef.current || activeTab === "AI") return;
    
    const handleReceive = (data: any) => {
      const myId = Number(localStorage.getItem("user_id"));
      if (Number(data.sender_id) === myId) return; 

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

  // 3. Load lịch sử chat (AI vs HDV)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (activeTab === "AI") {
      const loadAIHistory = async () => {
        try {
          const res = await axios.get(`http://localhost:5000/api/chat/ai/history`, {
            params: { session_id: getSessionId() },
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.data.length > 0) setMessages(res.data);
          else if (currentUser) initAIChat(currentUser.name);
        } catch { if (currentUser) initAIChat(currentUser.name); }
      };
      loadAIHistory();
    } else {
      axios.get(`http://localhost:5000/api/chat/messages/${activeTab}`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => setMessages(res.data));
    }
  }, [activeTab, currentUser, initAIChat]);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isTyping]);

  // 4. Gửi tin nhắn
  const handleSend = async () => {
    if (!inputMsg.trim() || !currentUser) return;
    const content = inputMsg;
    const token = localStorage.getItem("token");
    setInputMsg("");

    setMessages(prev => [...prev, { sender_id: currentUser.id, content }]);

    if (activeTab === "AI") {
      setIsTyping(true);
      try {
        const res = await axios.post("http://localhost:5000/api/chat/ai", { 
          message: content, 
          user_id: currentUser.id,
          session_id: getSessionId() 
        });
        setMessages(prev => [...prev, { sender_id: "AI", content: res.data.reply, tours: res.data.suggested_tours }]);
      } catch {
        setMessages(prev => [...prev, { sender_id: "AI", content: "AI đang bận, thử lại sau nhé!" }]);
      } finally {
        setIsTyping(false);
      }
    } else {
      await axios.post("http://localhost:5000/api/chat/send", { receiver_id: activeTab, content }, 
      { headers: { Authorization: `Bearer ${token}` } });
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 h-[calc(100vh-80px)]">
      <div className="flex h-full bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        
        {/* SIDEBAR */}
        <div className="w-1/4 bg-gray-50 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b font-bold text-gray-700">Hộp thoại</div>
          <div className="flex-1 overflow-y-auto">
            <div onClick={() => setActiveTab("AI")} className={`p-4 cursor-pointer flex items-center gap-3 transition ${activeTab === "AI" ? "bg-emerald-100 border-l-4 border-emerald-500" : "hover:bg-emerald-50"}`}>
              <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold shadow-sm">AI</div>
              <div><p className="font-bold text-gray-800">Trợ lý AI</p><p className="text-xs text-gray-500 italic">Tư vấn tự động</p></div>
            </div>
            <div className="p-2 text-[10px] font-bold text-gray-400 uppercase mt-4 ml-2 tracking-wider">Hướng dẫn viên</div>
            {partners.map(p => (
              <div key={p.id} onClick={() => setActiveTab(p.id)} className={`p-4 cursor-pointer flex items-center gap-3 transition ${activeTab === p.id ? "bg-white border-l-4 border-blue-500 shadow-sm" : "hover:bg-gray-100"}`}>
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">{p.name[0].toUpperCase()}</div>
                <div className="flex-1 overflow-hidden"><p className="font-bold text-gray-800 truncate">{p.name}</p><p className="text-[11px] text-gray-500">HDV Chuyên nghiệp</p></div>
              </div>
            ))}
          </div>
        </div>

        {/* CHAT AREA */}
        <div className="flex-1 flex flex-col bg-[#f0f2f5]">
          <div className="p-4 border-b bg-white flex items-center gap-3 shadow-sm z-10">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm ${activeTab === "AI" ? "bg-emerald-500" : "bg-blue-500"}`}>
              {activeTab === "AI" ? "AI" : partners.find(p => p.id === activeTab)?.name[0]}
            </div>
            <div>
              <h2 className="font-bold text-lg text-gray-800">{activeTab === "AI" ? "Trợ lý ảo thông minh" : partners.find(p => p.id === activeTab)?.name}</h2>
              <p className="text-xs text-emerald-600 flex items-center gap-1 font-medium"><span className="w-2 h-2 bg-current rounded-full animate-pulse"></span>Đang hoạt động</p>
            </div>
          </div>

          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {messages.map((msg, idx) => {
              const isMe = Number(msg.sender_id) === Number(currentUser?.id);
              return (
                <div key={idx} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                  <div className={`flex ${isMe ? "justify-end" : "justify-start"} w-full`}>
                    {!isMe && <div className={`w-8 h-8 rounded-full mr-2 flex items-center justify-center text-[10px] text-white shadow-sm ${msg.sender_id === "AI" ? "bg-emerald-500" : "bg-blue-500"}`}>{msg.sender_id === "AI" ? "AI" : "HDV"}</div>}
                    <div className={`max-w-[75%] p-3 rounded-2xl text-[14px] leading-relaxed shadow-sm ${isMe ? "bg-blue-600 text-white rounded-br-none" : "bg-white border border-gray-200 text-gray-800 rounded-bl-none"}`}>{msg.content}</div>
                  </div>
                  {msg.tours && msg.tours.length > 0 && (
                    <div className="mt-3 ml-10 flex gap-3 overflow-x-auto max-w-full pb-2 no-scrollbar">
                      {msg.tours.map((t: any) => (
                        <div key={t.id} className="min-w-[200px] bg-white rounded-xl border border-emerald-200 shadow-lg overflow-hidden flex flex-col hover:scale-105 transition-transform">
                          <img src={`http://localhost:5000/static/uploads/${t.image}`} className="h-24 w-full object-cover" alt="" />
                          <div className="p-3">
                            <h4 className="font-bold text-gray-800 text-[11px] line-clamp-2 h-8">{t.name}</h4>
                            <p className="text-red-600 font-extrabold text-sm mb-2">{t.price?.toLocaleString()} đ</p>
                            <Link href={`/tours/${t.id}`} className="block w-full text-center bg-emerald-600 text-white text-[10px] font-bold py-2 rounded-lg">XEM CHI TIẾT</Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            
            {isTyping && (
              <div className="flex items-start gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] text-white shadow-sm">AI</div>
                <div className="bg-white border p-3 rounded-2xl rounded-bl-none shadow-sm flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>

          <div className="p-4 bg-white border-t border-gray-200">
            <form onSubmit={e => { e.preventDefault(); handleSend(); }} className="flex gap-2">
              <input type="text" className="flex-1 p-3 bg-gray-100 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={inputMsg} onChange={e => setInputMsg(e.target.value)} placeholder={activeTab === "AI" ? "Hỏi AI về tour..." : "Nhập câu hỏi tại đây..."} />
              <button type="submit" className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-blue-700 transition shadow-md">Gửi</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CustomerChatPage() {
  return <Suspense fallback={<div className="p-10 text-center">Đang tải chat...</div>}><CustomerChatContent /></Suspense>;
}