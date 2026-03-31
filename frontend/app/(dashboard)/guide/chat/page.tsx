// frontend/app/(dashboard)/guide/chat/page.tsx
"use client";
import React, { useEffect, useState, useRef, Suspense } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import { socket } from "@/lib/socket"; // Sử dụng socket instance chung

function GuideChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<number | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMsg, setInputMsg] = useState("");
  const [partners, setPartners] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. Khởi tạo User và kết nối Socket
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("user_id");
    
    if (!token || !userId) { 
      router.push("/login"); 
      return; 
    }

    const uid = parseInt(userId);
    setCurrentUser({ id: uid });

    // Hàm Join Room để nhận tin nhắn realtime
    const joinChatRoom = () => {
      const roomName = `user_${uid}`;
      if (socket.connected) {
        socket.emit("join", { room: roomName });
      } else {
        socket.once("connect", () => {
          socket.emit("join", { room: roomName });
        });
        socket.connect();
      }
    };

    joinChatRoom();

    // Lấy danh sách khách hàng đã từng nhắn tin
    axios.get("http://localhost:5000/api/chat/partners", { 
      headers: { Authorization: `Bearer ${token}` } 
    }).then(res => {
        // Lọc bỏ chính mình khỏi danh sách đối tác
        const filtered = res.data.filter((p: any) => Number(p.id) !== uid);
        setPartners(filtered);
        
        // Ưu tiên mở partnerId từ URL (nếu có), nếu không mở người đầu tiên
        const pId = searchParams.get("partnerId");
        if (pId) {
          setActiveTab(parseInt(pId));
        } else if (filtered.length > 0) {
          setActiveTab(filtered[0].id);
        }
    }).catch(console.error);

    const handleReceiveMessage = (data: any) => {
      // Chỉ push vào mảng nếu tin nhắn thuộc về cuộc hội thoại đang mở
      // Hoặc nếu bạn muốn cập nhật thông báo tin nhắn mới ở list bên trái
      setMessages((prev) => {
        if (data.id && prev.some((m) => m.id === data.id)) return prev;
        return [...prev, data];
      });
    };

    socket.on("receive_message", handleReceiveMessage);

    return () => { 
      socket.off("receive_message", handleReceiveMessage);
    };
  }, [router, searchParams]);

  // 2. Tải lịch sử tin nhắn khi đổi người chat
  useEffect(() => {
    if (!activeTab) return;
    
    const token = localStorage.getItem("token");
    axios.get(`http://localhost:5000/api/chat/messages/${activeTab}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      setMessages(res.data);
    })
    .catch(err => console.error("Lỗi tải tin nhắn:", err));
  }, [activeTab]);

  // 3. Tự động cuộn xuống
  useEffect(() => { 
    scrollRef.current?.scrollIntoView({ behavior: "smooth" }); 
  }, [messages]);

  // 4. Xử lý gửi tin nhắn
  const handleSend = async () => {
    if (!inputMsg.trim() || !activeTab || !currentUser) return;
    
    const content = inputMsg;
    setInputMsg("");

    // Optimistic UI: Hiển thị ngay lập tức
    const tempMsg = { 
      sender_id: currentUser.id, 
      content, 
      created_at: new Date().toISOString() 
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      await axios.post("http://localhost:5000/api/chat/send", 
        { receiver_id: activeTab, content }, 
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
    } catch (err) {
      console.error("Lỗi gửi tin nhắn:", err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 h-[calc(100vh-120px)]">
      <div className="flex h-full bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden">
        
        {/* Sidebar: Danh sách khách hàng */}
        <div className="w-1/3 md:w-1/4 bg-gray-50 border-r border-gray-100 flex flex-col">
          <div className="p-6 border-b border-gray-200 bg-white">
            <h2 className="font-black text-gray-800 tracking-tight text-lg uppercase">Hỗ trợ khách</h2>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {partners.length > 0 ? partners.map(p => (
              <div 
                key={p.id} 
                onClick={() => setActiveTab(p.id)} 
                className={`p-5 cursor-pointer flex items-center gap-4 transition-all duration-300 ${
                  activeTab === p.id 
                  ? "bg-white border-r-4 border-blue-600 shadow-sm" 
                  : "hover:bg-gray-100"
                }`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black shadow-lg ${activeTab === p.id ? "bg-blue-600 scale-110" : "bg-slate-400"}`}>
                  {p.name ? p.name[0].toUpperCase() : "?"}
                </div>
                <div className="overflow-hidden flex-1">
                  <p className={`font-bold truncate ${activeTab === p.id ? "text-blue-600" : "text-gray-700"}`}>{p.name}</p>
                  <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mt-0.5">Customer</p>
                </div>
              </div>
            )) : (
              <div className="p-10 text-center text-gray-400 text-xs font-bold uppercase">Chưa có hội thoại</div>
            )}
          </div>
        </div>

        {/* Nội dung Chat */}
        <div className="flex-1 flex flex-col bg-[#fcfdfe]">
          {activeTab ? (
            <>
              {/* Header Chat */}
              <div className="p-5 border-b border-gray-100 bg-white flex items-center gap-4 shadow-sm z-10">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-black border border-blue-100">
                  {partners.find(p => p.id === activeTab)?.name?.[0] || "?"}
                </div>
                <div>
                  <h2 className="font-black text-gray-800 tracking-tight leading-none">
                    {partners.find(p => p.id === activeTab)?.name}
                  </h2>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Đang trực tuyến</span>
                  </div>
                </div>
              </div>

              {/* Danh sách tin nhắn */}
              <div className="flex-1 p-6 overflow-y-auto space-y-6 custom-scrollbar">
                {messages.map((msg, idx) => {
                  const isMe = Number(msg.sender_id) === Number(currentUser?.id);
                  return (
                    <div key={idx} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                      <div className={`flex items-end gap-2 max-w-[85%] ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                        <div className={`p-4 rounded-[1.8rem] text-sm leading-relaxed shadow-sm font-medium ${
                          isMe 
                          ? "bg-blue-600 text-white rounded-br-none shadow-blue-100" 
                          : "bg-white border border-gray-100 text-gray-800 rounded-bl-none shadow-slate-50"
                        }`}>
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={scrollRef} />
              </div>

              {/* Ô nhập tin nhắn */}
              <div className="p-6 bg-white border-t border-gray-100">
                <form 
                  onSubmit={e => { e.preventDefault(); handleSend(); }} 
                  className="flex gap-3 bg-gray-50 p-2 rounded-[2.5rem] border border-gray-200 focus-within:border-blue-500 focus-within:ring-4 ring-blue-50 transition-all"
                >
                  <input 
                    type="text" 
                    className="flex-1 px-5 py-2 bg-transparent outline-none text-sm font-medium" 
                    value={inputMsg} 
                    onChange={e => setInputMsg(e.target.value)} 
                    placeholder="Viết câu trả lời cho khách hàng..." 
                  />
                  <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-lg shadow-blue-200 active:scale-95">
                    Gửi ngay
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-300 gap-4">
               <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center text-5xl shadow-inner italic">?</div>
               <p className="font-black uppercase text-xs tracking-[0.3em]">Chọn khách hàng để phản hồi</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Bọc Suspense để xử lý useSearchParams trong Next.js Client Component
export default function GuideChatPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
           <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600"></div>
           <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Đang khởi tạo kênh chat...</p>
        </div>
      </div>
    }>
      <GuideChatContent />
    </Suspense>
  );
}