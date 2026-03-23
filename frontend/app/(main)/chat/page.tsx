"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import axios from "axios";
import { useRouter } from "next/navigation"; // 🛠️ Import Router để chuyển trang Login
import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface Message {
  id: string | number;
  sender_id: string;
  receiver_id?: string;
  content: string;
  timestamp: string;
  tours?: any[];
}

interface Partner {
  id: string;
  name: string;
  role: string;
  lastMessage?: string;
}

function CustomerChatContent() {
  const router = useRouter(); // 🛠️ Khởi tạo router
  const [activeTab, setActiveTab] = useState<string>("AI");
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMsg, setInputMsg] = useState<string>("");
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 🛠️ 1. Khôi phục State người dùng ngay khi Load trang
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!token || !userStr) {
      router.push("/login");
      return;
    }

    const parsedUser = JSON.parse(userStr);
    setCurrentUser(parsedUser);

    // Bốc Partners
    axios.get("http://localhost:5000/api/chat/partners", {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 60000
    })
    .then(res => setPartners(res.data || []))
    .catch(err => console.error("Lỗi lấy danh sách đối tác:", err));
  }, []);

  // Cuộn mượt màn hình
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);


  // ── 2. Load lịch sử chat + Subscribe Realtime ─────────────────
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !currentUser?.id) return; // Đợi lấy được currentUser.id từ Effect 1

    setLoadingHistory(true);

    if (activeTab === "AI") {
      axios.get("http://localhost:5000/api/chat/ai/history", {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => setMessages(res.data || []))
      .catch(err => console.error("Lỗi tải lịch sử AI:", err))
      .finally(() => setLoadingHistory(false));
    } else {
      axios.get(`http://localhost:5000/api/chat/messages/${activeTab}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => setMessages(res.data || []))
      .catch(err => {
        console.error("Lỗi tải lịch sử HDV:", err);
        setMessages([]);
      })
      .finally(() => setLoadingHistory(false));
    }

    // ── Supabase Realtime (Giữ String UUID) ───────────────────
    const myId = String(currentUser.id);
    const partnerId = String(activeTab);

    const channel = supabase
      .channel('messages-global-customer')
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
              if (prev.some(m => String(m.id) === String(newMsg.id))) return prev;
              if (String(newMsg.sender_id) === String(currentUser.id)) {
                return prev; // Không làm gì cả, vì handleSend đã vẽ giao diện rồi
              }
              return [...prev, {
                id: newMsg.id,
                sender_id: String(newMsg.sender_id),
                receiver_id: String(newMsg.receiver_id),
                content: newMsg.content || "",
                timestamp: newMsg.created_at || new Date().toISOString()
              }];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeTab, currentUser]); // 🛠️ Dựa trên activeTab và currentUser


  const handleSend = async () => {
    if (!inputMsg.trim()) return;
    if (!currentUser?.id) {
      alert("Vui lòng đăng nhập để gửi tin nhắn!");
      return;
    }
    const token = localStorage.getItem("token");
    const contentToSend = inputMsg.trim();
    setInputMsg("");

    if (activeTab === "AI") {
      const userMsg: Message = {
        id: Date.now(),
        sender_id: String(currentUser.id),
        content: contentToSend,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, userMsg]);
      setIsTyping(true);

      try {
        const res = await axios.post("http://localhost:5000/api/chat/ai", { message: contentToSend, user_id: currentUser.id }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          sender_id: "AI",
          content: res.data.reply,
          tours: res.data.suggested_tours || [],
          timestamp: new Date().toISOString()
        }]);
      } catch (err) {
        console.error("Lỗi AI chat:", err);
      } finally {
        setIsTyping(false);
      }
    } else {
      const optimisticMsg: Message = {
        id: Date.now(),
        sender_id: String(currentUser.id),
        content: contentToSend,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, optimisticMsg]);

      try {
        await axios.post("http://localhost:5000/api/chat/send", {
          receiver_id: String(activeTab),
          content: contentToSend
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) {
        console.error("Lỗi gửi tin tới HDV:", err);
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 h-[calc(100vh-80px)]">
      <div className="flex h-full bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        
        {/* Sidebar */}
        <div className="w-1/4 bg-gray-50 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b font-bold text-gray-700">Hộp thoại</div>
          <div className="flex-1 overflow-y-auto">
            <div onClick={() => setActiveTab("AI")} className={`p-4 cursor-pointer flex items-center gap-3 transition ${activeTab === "AI" ? "bg-emerald-100 border-l-4 border-emerald-500" : "hover:bg-emerald-50"}`}>
              <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold">AI</div>
              <div><p className="font-bold text-gray-800">Trợ lý AI</p><p className="text-xs text-gray-500 italic">Tư vấn tự động</p></div>
            </div>
            <div className="p-2 text-[10px] font-bold text-gray-400 uppercase mt-4 ml-2 tracking-wider">Hướng dẫn viên</div>
            {partners.map(p => (
              <div key={p.id} onClick={() => setActiveTab(p.id)} className={`p-4 cursor-pointer flex items-center gap-4 transition ${activeTab === p.id ? "bg-white border-l-4 border-blue-500 shadow-sm" : "hover:bg-gray-100"}`}>
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">{p.name ? p.name[0].toUpperCase() : "U"}</div>
                <div className="flex-1 overflow-hidden"><p className="font-bold text-gray-800 truncate">{p.name}</p><p className="text-[11px] text-gray-500">HDV Chuyên nghiệp</p></div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Content */}
        <div className="flex-1 flex flex-col bg-[#f0f2f5]">
          <div className="p-4 border-b bg-white flex items-center gap-3 shadow-sm z-10">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm ${activeTab === "AI" ? "bg-emerald-500" : "bg-blue-500"}`}>
              {activeTab === "AI" ? "AI" : (partners.find(p => p.id === activeTab)?.name?.[0] || "U")}
            </div>
            <div>
              <h2 className="font-bold text-lg text-gray-800">{activeTab === "AI" ? "Trợ lý ảo thông minh" : (partners.find(p => p.id === activeTab)?.name || "Người dùng")}</h2>
              <p className="text-xs text-emerald-600 flex items-center gap-1 font-medium"><span className="w-2 h-2 bg-current rounded-full animate-pulse"></span>Đang hoạt động</p>
            </div>
          </div>

          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {loadingHistory ? (
              <p className="text-center text-gray-500">Đang tải lịch sử...</p>
            ) : messages.length === 0 ? (
              <p className="text-center text-gray-500 py-10">Chưa có tin nhắn nào</p>
            ) : (
              messages.map((msg, idx) => {
                const isMe = msg.sender_id !== "AI" && String(msg.sender_id) === String(currentUser?.id);
                return (
                  <div key={idx} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                    <div className={`flex ${isMe ? "justify-end" : "justify-start"} w-full`}>
                      {!isMe && <div className={`w-8 h-8 rounded-full mr-2 flex items-center justify-center text-[10px] text-white shadow-sm ${msg.sender_id === "AI" ? "bg-emerald-500" : "bg-blue-500"}`}>{msg.sender_id === "AI" ? "AI" : "HDV"}</div>}
                      <div className={`max-w-[75%] p-3 rounded-2xl text-[14px] font-medium leading-relaxed shadow-sm ${isMe ? "bg-blue-600 text-white rounded-br-none" : "bg-white border border-gray-200 text-gray-800 rounded-bl-none"}`}>{msg.content}</div>
                    </div>
                    {msg.tours && msg.tours.map((t: any) => (
                      <div key={t.id} className="mt-3 ml-10 min-w-[200px] bg-white rounded-xl border border-emerald-200 shadow-lg overflow-hidden flex flex-col hover:scale-105 transition-transform">
                          <img src={t.image && t.image.startsWith('http') ? t.image : `http://localhost:5000/static/uploads/${t.image}`} className="h-24 w-full object-cover" alt="Tour" />
                          <div className="p-3">
                              <h4 className="font-bold text-gray-800 text-[11px] line-clamp-2">{t.name}</h4>
                              <p className="text-red-600 font-extrabold text-sm mb-2">{t.price?.toLocaleString()} đ</p>
                              <Link href={`/tours/${t.id}`} className="block w-full text-center bg-emerald-600 text-white text-[10px] font-bold py-2 rounded-lg">XEM CHI TIẾT</Link>
                          </div>
                      </div>
                    ))}
                  </div>
                );
              })
            )}
            {isTyping && <div className="text-xs text-gray-500 animate-pulse">Trợ lý AI đang xử lý...</div>}
            <div ref={scrollRef} />
          </div>

          <div className="p-4 bg-white border-t border-gray-200">
            <form onSubmit={e => { e.preventDefault(); handleSend(); }} className="flex gap-2">
              <input type="text" className="flex-1 p-3 bg-gray-100 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-500 text-gray-800" value={inputMsg} onChange={e => setInputMsg(e.target.value)} placeholder="Nhập tin nhắn..." />
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