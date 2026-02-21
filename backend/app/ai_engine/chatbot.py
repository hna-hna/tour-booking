import openai
import os

openai.api_key = os.getenv("OPENAI_API_KEY")

def ask_openai(message, context_data=""):
    """
    context_data: Chuỗi chứa thông tin các tour hiện có để AI trả lời đúng trọng tâm.
    """
    system_prompt = f"""
    Bạn là trợ lý ảo của công ty du lịch. 
    Dưới đây là danh sách tour của chúng tôi: {context_data}.
    Hãy tư vấn ngắn gọn, thân thiện và chốt đơn giúp khách hàng.
    """
    
    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message}
            ]
        )
        return response.choices[0].message['content']
    except Exception as e:
        return "Xin lỗi, hiện tại tôi đang quá tải. Vui lòng thử lại sau."