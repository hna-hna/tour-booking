import hashlib
import hmac
import urllib.parse

class vnpay:
    requestData = {}
    responseData = {}

    def get_payment_url(self, vnp_Url, secret_key):
        # Sắp xếp tham số theo a-z (Bắt buộc của VNPAY)
        inputData = sorted(self.requestData.items())
        
        queryString = ''
        seq = 0
        
        for key, val in inputData:
            if val: # Chỉ xử lý tham số có giá trị (không rỗng)
                # QUAN TRỌNG: Mã hóa giá trị ngay tại đây (VD: dấu cách -> +)
                encoded_val = urllib.parse.quote_plus(str(val))
                
                if seq == 1:
                    queryString = queryString + "&" + str(key) + '=' + encoded_val
                else:
                    seq = 1
                    queryString = str(key) + '=' + encoded_val

        # queryString lúc này chính là dữ liệu chuẩn để tạo Hash
        hashValue = self.__hmacsha512(secret_key, queryString)
        
        # URL cuối cùng = URL gốc + QueryString + Chữ ký
        return vnp_Url + "?" + queryString + '&vnp_SecureHash=' + hashValue

    def validate_response(self, secret_key):
        vnp_SecureHash = self.responseData.get('vnp_SecureHash')
        
        # Loại bỏ 2 tham số này trước khi check chữ ký
        if 'vnp_SecureHash' in self.responseData:
            self.responseData.pop('vnp_SecureHash')
        if 'vnp_SecureHashType' in self.responseData:
            self.responseData.pop('vnp_SecureHashType')

        inputData = sorted(self.responseData.items())
        queryString = ''
        seq = 0
        
        for key, val in inputData:
            if str(key).startswith('vnp_'):
                if val:
                    # Khi nhận về, VNPAY trả dữ liệu thô, ta cần encode lại để check hash
                    encoded_val = urllib.parse.quote_plus(str(val))
                    
                    if seq == 1:
                        queryString = queryString + "&" + str(key) + '=' + encoded_val
                    else:
                        seq = 1
                        queryString = str(key) + '=' + encoded_val
        
        hashValue = self.__hmacsha512(secret_key, queryString)
        return vnp_SecureHash == hashValue

    def __hmacsha512(self, key, data):
        byteKey = key.encode('utf-8')
        byteData = data.encode('utf-8')
        return hmac.new(byteKey, byteData, hashlib.sha512).hexdigest()