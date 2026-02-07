import openai
import os

class TravelChatbot:
    def __init__(self):
        # load API key từ biến môi trường
        self.api_key = os.getenv("OPENAI_API_KEY")
        
    def get_response(self, user_message, context_data=None):
        """
        user_message: Câu hỏi của khách
        context_data: Dữ liệu tour liên quan để cung cấp cho AI làm ngữ cảnh
        """
        if not self.api_key:
            return "Chưa cấu hình OpenAI Key."
        
        # Logic gọi OpenAI API
        return "Đây là phản hồi mẫu từ AI (Mock)."