document.getElementById("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const errorMsg = document.getElementById("error-msg");

    try {
        const response = await fetch("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok && data.token) {
            localStorage.setItem("token", data.token);
            localStorage.setItem("username", data.username);
            window.location.href = "/";
        } else {
            errorMsg.textContent = data.error || "Authentication failed.";
            errorMsg.classList.remove("hidden");
        }
    } catch (err) {
        errorMsg.textContent = "Server connection lost.";
        errorMsg.classList.remove("hidden");
    }
});
