//frontend/app/(dashboard)/guide/chat/pages.tsx
"use client";
import React, { useEffect, useState, useRef, Suspense } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import { socket } from "@/lib/socket";

function GuideChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<number | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMsg, setInputMsg] = useState("");
  const [partners, setPartners] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // khởi tạo User, join room và Lắng nghe tin nhắn realtime
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("user_id");
    
    if (!token || !userId) { 
      router.push("/login"); 
      return; 
    }

    const uid = parseInt(userId);
    setCurrentUser({ id: uid });

    // Hàm Join Room
    const joinChatRoom = () => {
      const roomName = `user_${uid}`;
      if (socket.connected) {
        console.log("[GUIDE] Socket connected, joining:", roomName);
        socket.emit("join", { room: roomName });
      } else {
        socket.once("connect", () => {
          console.log(" [GUIDE] Connected now, joining:", roomName);
          socket.emit("join", { room: roomName });
        });
        socket.connect();
      }
    };

    joinChatRoom();

    // lấy danh sách khách
    axios.get("http://localhost:5000/api/chat/partners", { 
      headers: { Authorization: `Bearer ${token}` } 
    }).then(res => {
        const filtered = res.data.filter((p: any) => Number(p.id) !== uid);
        setPartners(filtered);
        
        const pId = searchParams.get("partnerId");
        if (pId) {
          setActiveTab(parseInt(pId));
        } else if (filtered.length > 0 && !activeTab) {
          setActiveTab(filtered[0].id);
        }
    }).catch(console.error);

    const handleReceiveMessage = (data: any) => {
      console.log(" Nhận tin nhắn mới:", data);
      
      setMessages((prev) => {
        if (data.id && prev.some((m) => m.id === data.id)) return prev;
        return [...prev, data];
      });
    };

    socket.on("receive_message", handleReceiveMessage);

    return () => { 
      socket.off("receive_message", handleReceiveMessage);
      socket.off("connect");
    };
  }, [router, searchParams]);

  // tải lịch sử tin nhắn 
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

  // tự động cuộn xuống tin nhắn mới nhất
  useEffect(() => { 
    scrollRef.current?.scrollIntoView({ behavior: "smooth" }); 
  }, [messages]);

  // xử lý gửi tin nhắn
  const handleSend = async () => {
    if (!inputMsg.trim() || !activeTab || !currentUser) return;
    
    const content = inputMsg;
    setInputMsg("");

    // hiển thị tin nhắn ngay lập tức 
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
    <div className="max-w-6xl mx-auto p-6 h-[calc(100vh-100px)]">
      <div className="flex h-full bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
        
        <div className="w-1/3 md:w-1/4 bg-gray-50 border-r border-gray-100 flex flex-col">
          <div className="p-6 border-b border-gray-200 bg-white">
            <h2 className="font-black text-gray-800 tracking-tight text-lg">Tin nhắn hỗ trợ</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {partners.map(p => (
              <div 
                key={p.id} 
                onClick={() => setActiveTab(p.id)} 
                className={`p-4 cursor-pointer flex items-center gap-4 transition-all duration-300 ${
                  activeTab === p.id 
                  ? "bg-white border-r-4 border-blue-600 shadow-inner" 
                  : "hover:bg-gray-100"
                }`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black shadow-md ${activeTab === p.id ? "bg-blue-600" : "bg-blue-400"}`}>
                  {p.name ? p.name[0].toUpperCase() : "?"}
                </div>
                <div className="overflow-hidden flex-1">
                  <p className={`font-bold truncate ${activeTab === p.id ? "text-blue-600" : "text-gray-700"}`}>{p.name}</p>
                  <p className="text-[10px] text-gray-400 font-bold  tracking-tighter italic">Khách hàng</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/*nội dung chat */}
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
                  <p className="text-[5px] flex items-center gap-0.5 font-black  uppercase tracking-widest">
                    <span className=" rounded-full "></span>
                  Đang trực tuyến
                  </p>
                </div>
              </div>

              {/* danh sách tin nhắn */}
              <div className="flex-1 p-6 overflow-y-auto space-y-6">
                {messages.map((msg, idx) => {
                  const isMe = Number(msg.sender_id) === Number(currentUser?.id);
                  return (
                    <div key={idx} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                      <div className={`flex items-end gap-2 max-w-[80%] ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                        <div className={`p-4 rounded-[1.5rem] text-sm leading-relaxed shadow-sm font-medium ${
                          isMe 
                          ? "bg-blue-600 text-white rounded-br-none" 
                          : "bg-white border border-gray-100 text-gray-800 rounded-bl-none"
                        }`}>
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={scrollRef} />
              </div>

              {/* ô nhập tin nhắn */}
              <div className="p-6 bg-white border-t border-gray-100">
                <form 
                  onSubmit={e => { e.preventDefault(); handleSend(); }} 
                  className="flex gap-3 bg-gray-50 p-2 rounded-[2rem] border border-gray-200 focus-within:border-blue-500 focus-within:ring-2 ring-blue-50 transition-all"
                >
                  <input 
                    type="text" 
                    className="flex-1 px-4 py-2 bg-transparent outline-none text-sm font-medium" 
                    value={inputMsg} 
                    onChange={e => setInputMsg(e.target.value)} 
                    placeholder="Nhập nội dung phản hồi..." 
                  />
                  <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-full font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-200">
                    Gửi
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-4">
               <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-3xl">💬</div>
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