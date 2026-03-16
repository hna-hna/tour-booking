import hashlib
import hmac
import urllib.parse

class vnpay:
    requestData = {}
    responseData = {}

    def get_payment_url(self, vnp_Url, secret_key):
        # 1. Sắp xếp tham số a-z
        inputData = sorted(self.requestData.items())
        
        # 2. Xây dựng chuỗi query dùng chuẩn quote (không phải quote_plus)
        # VNPay 2.1.0 ưu tiên chuẩn mã hóa %20 cho dấu cách
        query_params = []
        for key, val in inputData:
            if val is not None and str(val) != "":
                # Dùng quote chuẩn để đồng bộ 100%
                encoded_val = urllib.parse.quote(str(val))
                query_params.append(f"{key}={encoded_val}")

        queryString = "&".join(query_params)

        # 3. Tạo chữ ký SHA512
        hashValue = hmac.new(
            secret_key.encode('utf-8'),
            queryString.encode('utf-8'),
            hashlib.sha512
        ).hexdigest()
        
        return vnp_Url + "?" + queryString + '&vnp_SecureHash=' + hashValue

    def validate_response(self, secret_key):
        vnp_SecureHash = self.responseData.get('vnp_SecureHash')
        
        # Lấy các tham số bắt đầu bằng vnp_ và không phải hash
        data = {k: v for k, v in self.responseData.items() 
                if k.startswith('vnp_') and k != 'vnp_SecureHash' and k != 'vnp_SecureHashType'}
        
        inputData = sorted(data.items())
        
        # BẮT BUỘC: Khi kiểm tra mã trả về, phải dùng cùng chuẩn mã hóa với lúc gửi đi
        query_params = []
        for key, val in inputData:
            if val is not None and str(val) != "":
                encoded_val = urllib.parse.quote(str(val))
                query_params.append(f"{key}={encoded_val}")
        
        queryString = "&".join(query_params)
        
        # Dùng hàm nội bộ để băm lại
        checkValue = self.__hmacsha512(secret_key, queryString)
        return vnp_SecureHash == checkValue

    def __hmacsha512(self, key, data):
        byteKey = key.encode('utf-8')
        byteData = data.encode('utf-8')
        return hmac.new(byteKey, byteData, hashlib.sha512).hexdigest()