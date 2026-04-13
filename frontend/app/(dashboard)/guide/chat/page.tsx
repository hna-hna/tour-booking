"use client";
import React, { useEffect, useState, useRef, Suspense } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface Message {
  id: string | number;
  sender_id: string;
  receiver_id?: string;
  content: string;
  timestamp: string;
}

interface Partner {
  id: string;
  name: string;
  role: string;
  lastMessage?: string;
}

function GuideChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMsg, setInputMsg] = useState<string>("");
  const [partners, setPartners] = useState<Partner[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("user_id");

    if (!token || !userId) {
      router.push("/login");
      return;
    }
    const uidStr = String(userId);
    setCurrentUser({ id: String(userId) });

    axios.get("http://localhost:5000/api/chat/partners", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        const filtered = res.data.filter((p: any) => String(p.id) !== String(userId));
        setPartners(filtered);
        
        const pId = searchParams.get("partnerId");
        if (pId) {
          setActiveTab(String(pId));
        } else if (filtered.length > 0 && !activeTab) {
          setActiveTab(String(filtered[0].id));
        }
      })
      .catch(err => console.error("Lỗi tải partners:", err));
  }, [router, searchParams]);

  // 2. Load lịch sử + Realtime khi activeTab thay đổi
useEffect(() => {
  if (!activeTab || !currentUser?.id) return;

  setLoadingHistory(true);
  const token = localStorage.getItem("token");

  axios.get(`http://localhost:5000/api/chat/messages/${activeTab}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(res => {
      setMessages(res.data || []);
    })
    .catch(err => {
      console.error("Lỗi tải lịch sử:", err);
      setMessages([]);
    })
    .finally(() => setLoadingHistory(false));

  const myId = String(currentUser.id);
  const partnerId = String(activeTab);

  // Gộp kênh lắng nghe toàn cục giúp giảm tải kết nối
  const channel = supabase
    .channel('messages-global-guide')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages' },
      (payload) => {
        const newMsg = payload.new;

        const isRelevant =
          (String(newMsg.sender_id) === myId && String(newMsg.receiver_id) === partnerId) ||
          (String(newMsg.sender_id) === partnerId && String(newMsg.receiver_id) === myId);

        if (isRelevant) {
          setMessages((prev) => {
            // Ngăn chặn tin nhắn trùng lặp
            if (prev.some(m => String(m.id) === String(newMsg.id))) return prev;
            if (String(newMsg.sender_id) === String(currentUser.id)) {
                return prev;
            }
            return [...prev, {
              id: newMsg.id,
              sender_id: String(newMsg.sender_id),
              receiver_id: String(newMsg.receiver_id),
              content: newMsg.content || "",
              timestamp: newMsg.timestamp || new Date().toISOString()
            }];
          });
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [activeTab, currentUser?.id]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!inputMsg.trim() || !activeTab || !currentUser) return;

    const contentToSend = inputMsg.trim();
    const token = localStorage.getItem("token");
    setInputMsg("");

    const optimisticMsg: Message = {
      id: Date.now(),
      sender_id: String(currentUser.id),
      content: contentToSend,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, optimisticMsg]);

    try {
      await axios.post("http://localhost:5000/api/chat/send", 
        { receiver_id: String(activeTab), content: contentToSend },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err: any) {
      console.error("Lỗi gửi tin nhắn HDV:", err.response?.data || err.message);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 h-[calc(100vh-100px)]">
      <div className="flex h-full bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
        {/* Sidebar */}
        <div className="w-1/3 md:w-1/4 bg-gray-50 border-r border-gray-200 flex flex-col">
          <div className="p-6 border-b border-gray-200 bg-white">
            <h2 className="font-black text-gray-800 tracking-tight text-lg">Tin nhắn hỗ trợ</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {partners.map(p => (
              <div
                key={p.id}
                onClick={() => setActiveTab(p.id)}
                className={`p-4 cursor-pointer flex items-center gap-4 transition-all duration-300 ${activeTab === p.id ? "bg-white border-r-4 border-blue-600 shadow-inner" : "hover:bg-gray-100"}`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black shadow-md ${activeTab === p.id ? "bg-blue-600" : "bg-blue-400"}`}>
                  {p.name ? p.name[0].toUpperCase() : "?"}
                </div>
                <div className="overflow-hidden flex-1">
                  <p className={`font-bold truncate ${activeTab === p.id ? "text-blue-600" : "text-gray-700"}`}>{p.name}</p>
                  <p className="text-[10px] text-gray-400 font-bold tracking-tighter italic">Khách hàng</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat content */}
        <div className="flex-1 flex flex-col bg-[#f8f9fb]">
          {activeTab ? (
            <>
              <div className="p-5 border-b border-gray-100 bg-white flex items-center gap-4 shadow-sm z-10">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 font-black">
                  {partners.find(p => p.id === activeTab)?.name?.[0] || "?"}
                </div>
                <div>
                  <h2 className="font-black text-gray-800 tracking-tight">
                    {partners.find(p => p.id === activeTab)?.name}
                  </h2>
                  <p className="text-[10px] flex items-center gap-1 font-black uppercase tracking-widest text-emerald-500">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                    Đang trực tuyến
                  </p>
                </div>
              </div>

              <div className="flex-1 p-6 overflow-y-auto space-y-6">
                {loadingHistory ? (
                  <p className="text-center text-gray-500">Đang tải lịch sử...</p>
                ) : messages.length === 0 ? (
                  <p className="text-center text-gray-500 py-10">Chưa có tin nhắn nào</p>
                ) : (
                  messages.map((msg, idx) => {
                    const isMe = String(msg.sender_id) === String(currentUser?.id);
                    return (
                      <div key={idx} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                        <div className={`flex items-end gap-2 max-w-[80%] ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                          <div className={`p-4 rounded-[1.5rem] text-sm font-medium leading-relaxed shadow-sm ${isMe
                            ? "bg-blue-600 text-white rounded-br-none"
                            : "bg-white border border-gray-100 text-gray-800 rounded-bl-none"
                          }`}>
                            {msg.content}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={scrollRef} />
              </div>

              <div className="p-6 bg-white border-t border-gray-100">
                <form onSubmit={e => { e.preventDefault(); handleSend(); }} className="flex gap-3 bg-gray-50 p-2 rounded-[2rem] border border-gray-200 focus-within:border-blue-500 focus-within:ring-2 ring-blue-50 transition-all">
                  <input type="text" className="flex-1 px-4 py-2 bg-transparent outline-none text-sm font-medium text-gray-800" value={inputMsg} onChange={e => setInputMsg(e.target.value)} placeholder="Nhập nội dung phản hồi..." />
                  <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-full font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-200">
                    Gửi
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-4">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-3xl"></div>
              <p className="font-bold tracking-tight">Chọn một cuộc hội thoại để bắt đầu hỗ trợ</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function GuideChatPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    }>
      <GuideChatContent />
    </Suspense>
  );
}