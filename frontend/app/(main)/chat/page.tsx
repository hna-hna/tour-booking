"use client";
import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";

// Interface tin nhắn
interface Message {
  id?: number;
  sender: "me" | "partner" | "ai";
  text: string;
  time?: string;
}

// Interface đối tác chat (HDV)
interface ChatPartner {
  id: number;
  name: string;
  role: string;
  lastMessage?: string;
}

export default function CustomerChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State quản lý
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"AI" | number>("AI"); // 'AI' hoặc ID của HDV
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMsg, setInputMsg] = useState("");
  const [partners, setPartners] = useState<ChatPartner[]>([]); // Danh sách HDV đã từng chat
  const [socket, setSocket] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. Khởi tạo: Lấy profile, kết nối socket, lấy danh sách HDV
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("user_id");
    const userName = localStorage.getItem("user_name");

    if (!token || !userId) {
      router.push("/login");
      return;
    }

    setCurrentUser({ id: parseInt(userId), name: userName });

    // Kết nối Socket
    const newSocket = io("http://localhost:5000");
    newSocket.emit("join", { room: `user_${userId}` }); // Join room của chính mình để nhận tin
    setSocket(newSocket);

    // Lấy danh sách HDV đã từng chat (API cần viết ở Backend)
    // Giả lập dữ liệu nếu chưa có API:
    // axios.get("http://localhost:5000/api/chat/partners", { headers: ... })
    //   .then(res => setPartners(res.data));
    setPartners([
      { id: 3, name: "Nguyễn Văn Hướng", role: "HDV Tour Sapa", lastMessage: "Chào bạn..." },
      { id: 2, name: "HDV Phú Quốc", role: "HDV Tour Biển", lastMessage: "Đón sân bay..." },
    ]);

    // Check URL xem có yêu cầu chat với HDV cụ thể không? (Từ trang chi tiết đơn hàng)
    const partnerIdParam = searchParams.get("partnerId");
    const partnerNameParam = searchParams.get("name");
    
    if (partnerIdParam) {
      // Nếu có, chuyển tab sang HDV đó
      const pId = parseInt(partnerIdParam);
      setActiveTab(pId);
      // Nếu HDV này chưa có trong list thì thêm tạm vào để hiển thị
      if (!partners.find(p => p.id === pId) && partnerNameParam) {
        setPartners(prev => [...prev, { id: pId, name: partnerNameParam, role: "Hướng dẫn viên" }]);
      }
    } else {
      // Mặc định vào AI
      initAIChat(userName || "Bạn");
    }

    return () => { newSocket.disconnect(); };
  }, []);

  // 2. Lắng nghe tin nhắn Realtime (Từ HDV)
  useEffect(() => {
    if (!socket) return;
    
    socket.on("receive_message", (data: any) => {
      // Chỉ hiện tin nhắn nếu đang mở tab của người gửi đó
      if (activeTab === data.sender_id) {
        setMessages((prev) => [...prev, { sender: "partner", text: data.content }]);
      } else {
        // Nếu đang ở tab khác, có thể hiện thông báo đỏ (chưa làm ở đây)
        alert(`Có tin nhắn mới từ ID ${data.sender_id}`);
      }
    });

    return () => { socket.off("receive_message"); };
  }, [socket, activeTab]);

  // 3. Tự động cuộn xuống cuối khi có tin mới
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 4. Xử lý khi chuyển Tab
  useEffect(() => {
    setMessages([]); // Xóa màn hình cũ
    if (activeTab === "AI") {
      initAIChat(currentUser?.name || "Bạn");
    } else {
      // Load lịch sử chat với HDV này (API cần viết ở Backend)
      // axios.get(`http://localhost:5000/api/chat/history/${activeTab}`)...
      // Giả lập lịch sử:
      setTimeout(() => {
        setMessages([
          { sender: "me", text: "Xin chào HDV" },
          { sender: "partner", text: "Chào bạn, tôi có thể giúp gì?" }
        ]);
      }, 300);
    }
  }, [activeTab]);

  // Hàm khởi tạo AI Chat
  const initAIChat = (name: string) => {
    setMessages([
      { 
        sender: "ai", 
        text: `Xin chào ${name}!\nTôi là trợ lý AI của Tour Booking.\nDựa trên hồ sơ của bạn, tôi có thể tư vấn các tour phù hợp hoặc giải đáp thắc mắc về đơn hàng.` 
      }
    ]);
  };

  // 5. Gửi tin nhắn
  const handleSend = async () => {
    if (!inputMsg.trim()) return;

    const msgContent = inputMsg;
    setInputMsg(""); // Clear ô nhập
    setMessages(prev => [...prev, { sender: "me", text: msgContent }]); // Hiện tin mình chat

    if (activeTab === "AI") {
      // --- CHAT VỚI AI ---
      try {
        // Gọi API Chatbot
        const res = await axios.post("http://localhost:5000/api/chat/ai", {
          message: msgContent,
          user_id: currentUser.id // Gửi ID để Backend lấy ngữ cảnh đơn hàng/profile
        });
        
        // Hiện câu trả lời của AI
        setMessages(prev => [...prev, { sender: "ai", text: res.data.reply }]);
      } catch (e) {
        setMessages(prev => [...prev, { sender: "ai", text: "Xin lỗi, tôi đang gặp sự cố kết nối." }]);
      }

    } else {
      // --- CHAT VỚI HDV (Realtime) ---
      if (socket) {
        socket.emit("send_message", {
          sender_id: currentUser.id,
          receiver_id: activeTab, // ID của HDV đang chat
          content: msgContent
        });
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 h-[calc(100vh-80px)]">
      <div className="flex h-full bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        
        {/* SIDEBAR DANH SÁCH */}
        <div className="w-1/4 bg-gray-50 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200 font-bold text-gray-700">Hộp thoại</div>
          
          <div className="flex-1 overflow-y-auto">
            {/* Mục AI */}
            <div 
              onClick={() => setActiveTab("AI")}
              className={`p-4 cursor-pointer flex items-center gap-3 transition hover:bg-emerald-50 ${activeTab === "AI" ? "bg-emerald-100 border-l-4 border-emerald-500" : ""}`}
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xl"></div>
              <div>
                <p className="font-bold text-gray-800">Trợ lý AI</p>
                <p className="text-xs text-gray-500">Tư vấn tự động</p>
              </div>
            </div>

            {/* Danh sách HDV */}
            <div className="p-2 text-xs font-bold text-gray-400 uppercase mt-2 ml-2">Hướng dẫn viên</div>
            {partners.map(p => (
              <div 
                key={p.id}
                onClick={() => setActiveTab(p.id)}
                className={`p-4 cursor-pointer flex items-center gap-3 transition hover:bg-gray-100 ${activeTab === p.id ? "bg-white border-l-4 border-blue-500 shadow-sm" : ""}`}
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

        {/* KHUNG CHAT CHÍNH */}
        <div className="w-3/4 flex flex-col">
          {/* Header Chat */}
          <div className="p-4 border-b border-gray-200 bg-white flex items-center gap-3 shadow-sm z-10">
            {activeTab === "AI" ? (
               <>
                 <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xl"></div>
                 <div>
                    <h2 className="font-bold text-lg text-gray-800">Trợ lý ảo thông minh</h2>
                    <p className="text-xs text-emerald-600">● Luôn sẵn sàng hỗ trợ</p>
                 </div>
               </>
            ) : (
               <>
                 <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                    {partners.find(p => p.id === activeTab)?.name.charAt(0)}
                 </div>
                 <div>
                    <h2 className="font-bold text-lg text-gray-800">{partners.find(p => p.id === activeTab)?.name}</h2>
                    <p className="text-xs text-blue-600">● Đang hoạt động</p>
                 </div>
               </>
            )}
          </div>

          {/* Nội dung Chat */}
          <div className="flex-1 p-6 overflow-y-auto bg-[#f0f2f5] space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}>
                {msg.sender !== "me" && (
                  <div className={`w-8 h-8 rounded-full mr-2 flex items-center justify-center text-xs text-white ${msg.sender === "ai" ? "bg-emerald-500" : "bg-blue-500"}`}>
                    {msg.sender === "ai" ? "AI" : "G"}
                  </div>
                )}
                <div className={`max-w-[70%] p-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.sender === "me" 
                    ? "bg-blue-600 text-white rounded-br-none" 
                    : msg.sender === "ai"
                      ? "bg-white border border-emerald-200 text-gray-800 rounded-bl-none shadow-sm"
                      : "bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm"
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={scrollRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={activeTab === "AI" ? "Hỏi AI về tour, giá vé..." : "Nhắn tin cho Hướng dẫn viên..."}
                className="flex-1 p-3 bg-gray-100 rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none transition"
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
              />
              <button 
                onClick={handleSend}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition"
              >
                Gửi
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}