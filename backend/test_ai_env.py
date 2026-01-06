# test_ai_env.py
try:
    import pandas as pd
    import numpy as np
    from sklearn.feature_extraction.text import TfidfVectorizer
    from openai import OpenAI
    import os
    from dotenv import load_dotenv

    # Giả lập load dữ liệu (Data Structures)
    data = {
        'tour_id': [1, 2],
        'description': ["Tour du lịch biển Nha Trang", "Tour leo núi Sapa"]
    }
    df = pd.DataFrame(data)
    
    # Test thư viện Scikit-learn
    tfidf = TfidfVectorizer()
    tfidf_matrix = tfidf.fit_transform(df['description'])
    
    print(" Pandas & Numpy: OK")
    print(" Scikit-learn: OK (Đã vector hóa dữ liệu mẫu)")
    
    # Test OpenAI
    load_dotenv()
    api_key = os.getenv("OPENAI_API_KEY")
    if api_key:
        print(" OpenAI Key: Đã tìm thấy trong .env")
    else:
        print(" OpenAI Key: Chưa cấu hình (Nhưng thư viện đã cài xong)")

except ImportError as e:
    print(f" Lỗi cài đặt thư viện: {e}")
except Exception as e:
    print(f" Lỗi khác: {e}")