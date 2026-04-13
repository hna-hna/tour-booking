"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import axios from "axios";
import { useRouter, useSearchParams, usePathname } from "next/navigation"; 
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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [activeTab, setActiveTab] = useState<string>("AI");
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMsg, setInputMsg] = useState<string>("");
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasLoadedPartners = useRef(false); 

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!token || !userStr) {
      alert("Vui lòng đăng nhập để sử dụng chức năng hỗ trợ!");
      router.push("/login");
      return;
    }
    
    setCurrentUser((prev: any) => prev ? prev : JSON.parse(userStr));
  }, [router]);

  const currentUserId = currentUser?.id ? String(currentUser.id) : null;

  //LOAD DANH SÁCH ĐỐI TÁC VÀ XỬ LÝ URL
  useEffect(() => {
    const token = localStorage.getItem("token");
    // Đợi có user và chưa load partner thì mới chạy
    if (!token || !currentUserId || hasLoadedPartners.current) return;

    const rid = searchParams.get("receiver_id");
    const rname = searchParams.get("name") || "Hướng dẫn viên";

    axios.get("http://localhost:5000/api/chat/partners", {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      let loadedPartners = res.data || [];
      hasLoadedPartners.current = true; // Đánh dấu đã load xong
      
      if (rid) {
        const targetId = String(rid);
        const exists = loadedPartners.find((p: any) => String(p.id) === targetId);
        
        if (!exists) {
          loadedPartners = [{ id: targetId, name: rname, role: "Hướng dẫn viên" }, ...loadedPartners];
        }
        
        setPartners(loadedPartners);
        setActiveTab(targetId);
        
        const params = new URLSearchParams(searchParams.toString());
        params.delete("receiver_id");
        params.delete("name");
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      } else {
        setPartners(loadedPartners);
      }
    })
    .catch(err => console.error("Lỗi lấy danh sách đối tác:", err));
  }, [currentUserId, searchParams, pathname, router]);

  // TẢI LỊCH SỬ CHAT & CÀI ĐẶT REALTIME SUPABASE 
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !currentUserId) return;

    setLoadingHistory(true);
    setMessages([]); // Chỉ xóa tin nhắn khi đổi activeTab

    const historyUrl = activeTab === "AI" 
      ? "http://localhost:5000/api/chat/ai/history"
      : `http://localhost:5000/api/chat/messages/${activeTab}`;

    axios.get(historyUrl, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => setMessages(res.data || []))
    .catch(err => console.error("Lỗi tải lịch sử:", err))
    .finally(() => setLoadingHistory(false));

    // REALTIME SUPABASE CHO CHAT HDV
    if (activeTab !== "AI") {
        const partnerId = String(activeTab);

        const channel = supabase
          .channel(`chat-customer-${currentUserId}-${partnerId}`)
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'messages' },
            (payload) => {
              const newMsg = payload.new;
              
              const senderStr = String(newMsg.sender_id);
              const receiverStr = String(newMsg.receiver_id);

              const isRelevant =
                (senderStr === currentUserId && receiverStr === partnerId) ||
                (senderStr === partnerId && receiverStr === currentUserId);
    
              if (isRelevant) {
                setMessages((prev) => {
                  // Ngăn trùng tin nhắn đã add do Optimistic UI
                  if (prev.some(m => String(m.id) === String(newMsg.id))) return prev;
                  // Nếu là mình gửi thì không add lại từ DB nữa
                  if (senderStr === currentUserId) return prev; 
                  
                  return [...prev, {
                    id: newMsg.id,
                    sender_id: senderStr,
                    receiver_id: receiverStr,
                    content: newMsg.content || "",
                    timestamp: newMsg.created_at || new Date().toISOString()
                  }];
                });
              }
            }
          )
          .subscribe();
    
        return () => { supabase.removeChannel(channel); };
    }
  }, [activeTab, currentUserId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // XỬ LÝ GỬI TIN NHẮN
  const handleSend = async () => {
    if (!inputMsg.trim() || !currentUserId) return;
    
    const token = localStorage.getItem("token");
    const contentToSend = inputMsg.trim();
    setInputMsg("");

    const myMsg: Message = {
        id: `temp-${Date.now()}`,
        sender_id: currentUserId,
        content: contentToSend,
        timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, myMsg]);

    if (activeTab === "AI") {
      setIsTyping(true);
      try {
        const res = await axios.post("http://localhost:5000/api/chat/ai", { 
            message: contentToSend,
            user_id: currentUserId || `guest_${Date.now()}` 
        }, {
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
      try {
        await axios.post("http://localhost:5000/api/chat/send", {
          receiver_id: String(activeTab),
          content: contentToSend
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) {
        console.error("Lỗi gửi tin tới HDV:", err);
        alert("Lỗi gửi tin nhắn, vui lòng thử lại.");
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 h-[calc(100vh-100px)]">
      <div className="flex h-full bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
        
        {/* Sidebar */}
        <div className="w-1/4 bg-gray-50 border-r border-gray-200 flex flex-col">
          <div className="p-6 border-b bg-white">
            <h1 className="text-xl font-black text-gray-800 tracking-tight">Hộp thoại</h1>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div 
              onClick={() => setActiveTab("AI")} 
              className={`p-4 mx-2 my-2 rounded-2xl cursor-pointer flex items-center gap-4 transition-all duration-300 ${
                activeTab === "AI" 
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200 scale-[1.02]" 
                : "hover:bg-emerald-50 text-gray-700"
              }`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shadow-inner ${activeTab === "AI" ? "bg-white/20" : "bg-emerald-500 text-white"}`}>AI</div>
              <div className="overflow-hidden">
                <p className="font-bold">Trợ lý ảo AI</p>
                <p className={`text-xs truncate ${activeTab === "AI" ? "text-emerald-100" : "text-gray-400"}`}>Tư vấn tour 24/7</p>
              </div>
            </div>

            <div className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Hướng dẫn viên</div>
            
            {partners.length === 0 ? (
                <p className="px-6 text-xs text-gray-400 italic">Chưa có cuộc hội thoại nào.</p>
            ) : (
                partners.map(p => (
                    <div 
                      key={p.id} 
                      onClick={() => setActiveTab(String(p.id))} 
                      className={`p-4 mx-2 my-1 rounded-2xl cursor-pointer flex items-center gap-4 transition-all duration-200 ${
                        activeTab === String(p.id) 
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-200" 
                        : "hover:bg-blue-50 text-gray-700"
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${activeTab === String(p.id) ? "bg-white/20" : "bg-blue-100 text-blue-600"}`}>
                        {p.name ? p.name[0].toUpperCase() : "U"}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="font-bold truncate">{p.name || "Người dùng"}</p>
                        <p className={`text-xs ${activeTab === String(p.id) ? "text-blue-100" : "text-gray-400"}`}>Hướng dẫn viên</p>
                      </div>
                    </div>
                  ))
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div className="flex-1 flex flex-col bg-[#F8FAFC]">
          <div className="p-5 border-b bg-white flex items-center justify-between shadow-sm z-10">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg ${activeTab === "AI" ? "bg-emerald-500 shadow-emerald-100" : "bg-blue-500 shadow-blue-100"}`}>
                {activeTab === "AI" ? "AI" : (partners.find(p => String(p.id) === activeTab)?.name?.[0] || "U")}
              </div>
              <div>
                <h2 className="font-bold text-lg text-gray-800">
                  {activeTab === "AI" ? "Trợ lý ảo thông minh" : (partners.find(p => String(p.id) === activeTab)?.name || "Đang kết nối...")}
                </h2>
                <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                    <span className="text-[12px] font-medium text-emerald-600">Đang trực tuyến</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 p-6 overflow-y-auto space-y-6 custom-scrollbar">
            {loadingHistory ? (
              <div className="flex justify-center items-center h-full text-gray-400 gap-2">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                  Đang tải lịch sử...
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-60">
                  <div className="text-4xl mb-2"></div>
                  <p>Hãy bắt đầu cuộc trò chuyện!</p>
              </div>
            ) : (
              messages.map((msg, idx) => {
                // Kiểm tra xem ai là người gửi (đảm bảo so sánh chuỗi)
                const isMe = msg.sender_id !== "AI" && String(msg.sender_id) === currentUserId;
                
                return (
                  <div key={idx} className={`flex ${isMe ? "justify-end" : "justify-start animate-in slide-in-from-left-2 duration-300"}`}>
                    <div className={`flex flex-col max-w-[70%] ${isMe ? "items-end" : "items-start"}`}>
                      <div className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
                        {!isMe && (
                            <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-[10px] text-white font-bold ${msg.sender_id === "AI" ? "bg-emerald-500" : "bg-blue-500"}`}>
                                {msg.sender_id === "AI" ? "AI" : "HDV"}
                            </div>
                        )}
                        <div className={`p-4 rounded-2xl text-[14px] leading-relaxed shadow-sm font-medium ${
                            isMe 
                            ? "bg-blue-600 text-white rounded-br-none" 
                            : "bg-white border border-gray-200 text-gray-800 rounded-bl-none"
                        }`}>
                          {msg.content}
                        </div>
                      </div>

                      {msg.tours && msg.tours.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 ml-10 w-full">
                          {msg.tours.map((t: any) => (
                            <div key={t.id} className="bg-white rounded-2xl border border-emerald-100 shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 group">
                              <div className="relative h-28 overflow-hidden">
                                <img 
                                  src={t.image && t.image.startsWith('http') ? t.image : `http://localhost:5000/static/uploads/${t.image}`} 
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                                  alt="Tour" 
                                />
                                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-[10px] font-bold text-red-600 shadow-sm">
                                    ĐỀ XUẤT
                                </div>
                              </div>
                              <div className="p-3">
                                <h4 className="font-bold text-gray-800 text-xs line-clamp-2 min-h-[32px]">{t.name}</h4>
                                <p className="text-red-600 font-black text-sm my-2">{t.price?.toLocaleString()} đ</p>
                                <Link href={`/tours/${t.id}`} className="block w-full text-center bg-gray-900 hover:bg-emerald-600 text-white text-[10px] font-bold py-2.5 rounded-xl transition-colors uppercase tracking-wider">
                                    Xem chi tiết
                                </Link>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            {isTyping && (
                <div className="flex items-center gap-2 ml-10 text-emerald-500 font-medium text-xs italic animate-pulse">
                    <span className="flex gap-1"><span className="w-1 h-1 bg-current rounded-full animate-bounce"></span><span className="w-1 h-1 bg-current rounded-full animate-bounce delay-75"></span><span className="w-1 h-1 bg-current rounded-full animate-bounce delay-150"></span></span>
                    Trợ lý đang suy nghĩ...
                </div>
            )}
            <div ref={scrollRef} />
          </div>

          <div className="p-6 bg-white border-t border-gray-100">
            <form 
              onSubmit={e => { e.preventDefault(); handleSend(); }} 
              className="flex items-center gap-3 bg-gray-100 p-2 rounded-2xl border border-transparent focus-within:border-blue-400 focus-within:bg-white transition-all duration-300 shadow-inner"
            >
              <input 
                type="text" 
                className="flex-1 p-3 bg-transparent border-none outline-none text-gray-800 text-sm placeholder:text-gray-400" 
                value={inputMsg} 
                onChange={e => setInputMsg(e.target.value)} 
                placeholder="Hỏi AI về tour du lịch hoặc nhắn tin cho HDV..." 
              />
              <button 
                type="submit" 
                disabled={!inputMsg.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white p-3 px-6 rounded-xl font-bold transition-all duration-300 shadow-lg shadow-blue-100"
              >
                Gửi
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CustomerChatPage() {
  return (
    <Suspense fallback={
        <div className="flex h-screen items-center justify-center bg-gray-50">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    }>
      <CustomerChatContent />
    </Suspense>
  );
}