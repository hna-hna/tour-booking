// app/(dashboard)/guide/chat/page.tsx
"use client";
import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";

export default function GuideChatPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // 1. Lấy thông tin từ URL (nếu có)
  const partnerIdFromUrl = searchParams.get("partnerId");
  const partnerNameFromUrl = searchParams.get("name");

  const [activeChat, setActiveChat] = useState<string | null>(partnerIdFromUrl);
  const [conversations, setConversations] = useState<any[]>([]); // Danh sách bên trái
  const [messages, setMessages] = useState<any[]>([]); // Nội dung chat bên phải
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);

  // 2. Lấy DANH SÁCH các cuộc trò chuyện cũ (Sidebar)
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        // Thay url này bằng API thật của bạn
        // const res = await axios.get("http://localhost:5000/api/guide/conversations");
        // setConversations(res.data);

        // Dữ liệu mẫu (Mock data)
        setConversations([
          { id: "700", name: "Nguyễn Văn Khách", lastMsg: "hi?", time: "10:30" },
          { id: "701", name: "Trần Thị B", lastMsg: "ok!", time: "Hôm qua" },
        ]);
      } catch (err) {
        console.error("Lỗi tải danh sách chat:", err);
      }
    };
    fetchConversations();
  }, []);

  // 3. Tải TIN NHẮN chi tiết khi activeChat thay đổi
  useEffect(() => {
    if (activeChat) {
      loadMessages(activeChat);
    }
  }, [activeChat]);

  const loadMessages = async (id: string) => {
    setLoading(true);
    try {
      // API lấy tin nhắn thật: await axios.get(`http://localhost:5000/api/chat/${id}`);
      
      // Giả lập tin nhắn theo ID
      setMessages([
        { id: 1, sender: "customer", text: `Xin chào, tôi là khách hàng ID ${id}` },
        { id: 2, sender: "me", text: "Chào bạn, tôi là HDV phụ trách tour của bạn." },
      ]);
    } catch (err) {
      console.error("Lỗi tải tin nhắn:", err);
    } finally {
      setLoading(false);
    }
  };

  // 4. Hàm khi nhấn vào một cuộc trò chuyện cũ ở Sidebar
  const handleSelectChat = (id: string, name: string) => {
    setActiveChat(id);
    // Cập nhật URL mà không reload trang để đồng bộ
    router.push(`/guide/chat?partnerId=${id}&name=${encodeURIComponent(name)}`);
  };

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    const newMessage = { id: Date.now(), sender: "me", text: inputText };
    setMessages([...messages, newMessage]);
    setInputText("");
  };

  return (
    <div className="h-[calc(100vh-140px)] flex bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      
      {/* SIDEBAR - DANH SÁCH CHAT CŨ */}
      <div className="w-1/3 border-r border-gray-100 bg-gray-50 flex flex-col">
        <div className="p-4 border-b border-gray-200 font-bold text-gray-700 bg-white sticky top-0 z-10">
          Hội thoại
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {conversations.map((chat) => (
            <div 
              key={chat.id}
              onClick={() => handleSelectChat(chat.id, chat.name)}
              className={`p-4 cursor-pointer hover:bg-white transition-all flex gap-3 border-b border-gray-50 ${
                activeChat === chat.id ? "bg-white border-l-4 border-cyan-500 shadow-sm" : ""
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold shadow-sm">
                {chat.name.charAt(0)}
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-gray-800 text-sm truncate">{chat.name}</span>
                  <span className="text-[10px] text-gray-400">{chat.time}</span>
                </div>
                <p className="text-xs text-gray-500 truncate">{chat.lastMsg}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CHAT WINDOW - NỘI DUNG TIN NHẮN */}
      <div className="w-2/3 flex flex-col bg-white">
        {activeChat ? (
          <>
            {/* Header người đang chat */}
            <div className="p-4 border-b border-gray-100 flex justify-between items-center shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-700 font-bold">
                  {partnerNameFromUrl?.charAt(0) || conversations.find(c => c.id === activeChat)?.name.charAt(0)}
                </div>
                <div>
                  <span className="font-bold text-gray-800">{partnerNameFromUrl || "Khách hàng"}</span>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span className="text-[10px] text-gray-400">Đang hoạt động</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Khu vực tin nhắn */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-gray-50/20">
              {loading ? (
                <div className="text-center text-gray-400 text-sm mt-10">Đang tải tin nhắn...</div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] p-3 px-4 rounded-2xl text-sm shadow-sm transition-all ${
                      msg.sender === "me" 
                        ? "bg-cyan-600 text-white rounded-tr-none shadow-cyan-100" 
                        : "bg-white border border-gray-100 text-gray-800 rounded-tl-none"
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Ô nhập tin nhắn */}
            <div className="p-4 border-t border-gray-100 flex gap-2 bg-white">
              <input 
                type="text" 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Nhập nội dung tin nhắn..." 
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
              />
              <button 
                onClick={handleSendMessage}
                className="bg-cyan-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-cyan-700 active:scale-95 transition-all shadow-lg shadow-cyan-100"
              >
                Gửi
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50/10">
            <p className="font-medium">Chọn một hành khách để xem tin nhắn</p>
            <p className="text-xs mt-1">Lịch sử chat sẽ được bảo mật giữa bạn và khách</p>
          </div>
        )}
      </div>
    </div>
  );
}