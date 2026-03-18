import hashlib
import hmac
import urllib.parse

class vnpay:
    def __init__(self):
        self.requestData = {}
        self.responseData = {}

    def get_payment_url(self, vnp_Url, secret_key):
        inputData = sorted(self.requestData.items())
        queryString = ''
        seq = 0
        
        for key, val in inputData:
            if str(val).strip() == '':
                continue
            
            # QUAN TRỌNG: VNPAY 2.1.0 yêu cầu Hash trên chuỗi ĐÃ ENCODE
            encoded_val = urllib.parse.quote_plus(str(val))
            
            if seq == 1:
                queryString += "&" + str(key) + '=' + encoded_val
            else:
                seq = 1
                queryString = str(key) + '=' + encoded_val

        # Hash trực tiếp queryString, không dùng hashData thô nữa
        hashValue = self.__hmacsha512(secret_key, queryString)

        print("\n" + "="*40)
        print("1. SECRET KEY ĐANG DÙNG:", secret_key)
        print("2. CHUỖI DỮ LIỆU ĐỂ BĂM (QueryString):")
        print(queryString)
        print("3. CHỮ KÝ TỰ TÍNH (HashValue):", hashValue)
        print("="*40 + "\n")

        return vnp_Url + "?" + queryString + '&vnp_SecureHash=' + hashValue

    def validate_response(self, secret_key):
        vnp_SecureHash = self.responseData.get('vnp_SecureHash', '')
        
        validData = {k: v for k, v in self.responseData.items()
                     if k not in ['vnp_SecureHash', 'vnp_SecureHashType']}

        inputData = sorted(validData.items())
        queryString = ''
        seq = 0
        
        for key, val in inputData:
            if str(key).startswith('vnp_') and str(val).strip() != '':
                encoded_val = urllib.parse.quote_plus(str(val))
                if seq == 1:
                    queryString += "&" + str(key) + '=' + encoded_val
                else:
                    seq = 1
                    queryString = str(key) + '=' + encoded_val
        
        hashValue = self.__hmacsha512(secret_key, queryString)
        return vnp_SecureHash.lower() == hashValue.lower()

    def __hmacsha512(self, key, data):
        byteKey = key.encode('utf-8')
        byteData = data.encode('utf-8')
        return hmac.new(byteKey, byteData, hashlib.sha512).hexdigest()