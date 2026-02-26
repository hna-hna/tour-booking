import requests

def test():
    # 1. Login
    res = requests.post("http://127.0.0.1:5000/api/auth/login", json={
        "email": "customer@example.com",
        "password": "123"
    })
    
    # If login fails because user doesn't exist, we just register one to be sure
    if res.status_code != 200:
        requests.post("http://127.0.0.1:5000/api/auth/register", json={
            "email": "testcust@example.com",
            "password": "123",
            "role": "customer"
        })
        res = requests.post("http://127.0.0.1:5000/api/auth/login", json={
            "email": "testcust@example.com",
            "password": "123"
        })

    if res.status_code != 200:
        print("Login failed!", res.text)
        return
        
    token = res.json().get("access_token")
    print("Token length:", len(token) if token else "No token")
    
    # 2. Test my-orders
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    # Try GET
    res2 = requests.get("http://127.0.0.1:5000/api/orders/my-orders", headers=headers)
    print("GET status:", res2.status_code)
    print("GET response:", res2.text)
    
    # Try OPTIONS manually
    res_opt = requests.options("http://127.0.0.1:5000/api/orders/my-orders", headers={
        "Access-Control-Request-Method": "GET",
        "Access-Control-Request-Headers": "authorization",
        "Origin": "http://localhost:3000"
    })
    print("OPTIONS status:", res_opt.status_code)
    print("OPTIONS response headers:", res_opt.headers)

if __name__ == "__main__":
    test()
