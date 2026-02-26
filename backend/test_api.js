async function test() {
    try {
        console.log("1. Login");
        let res = await fetch("http://127.0.0.1:5000/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: "customer@example.com", password: "123" })
        });

        if (!res.ok) {
            console.log("Registering first...");
            await fetch("http://127.0.0.1:5000/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: "testcust@example.com", password: "123", role: "customer" })
            });
            res = await fetch("http://127.0.0.1:5000/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: "testcust@example.com", password: "123" })
            });
        }

        const data = await res.json();
        const token = data.access_token;
        console.log("Token length:", token ? token.length : "No token");

        console.log("\n2. Test my-orders GET");
        const res2 = await fetch("http://127.0.0.1:5000/api/orders/my-orders", {
            headers: { "Authorization": `Bearer ${token}` }
        });
        console.log("GET status:", res2.status);
        if (!res2.ok) console.log("GET text:", await res2.text());

        console.log("\n3. Test my-orders OPTIONS");
        const resOpt = await fetch("http://127.0.0.1:5000/api/orders/my-orders", {
            method: "OPTIONS",
            headers: {
                "Access-Control-Request-Method": "GET",
                "Access-Control-Request-Headers": "authorization",
                "Origin": "http://localhost:3000"
            }
        });
        console.log("OPTIONS status:", resOpt.status);
        console.log("OPTIONS headers:", Object.fromEntries(resOpt.headers));
    } catch (e) {
        console.error(e);
    }
}
test();
