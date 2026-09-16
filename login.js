// ============================================
// TGPCET ERP - LOGIN JAVASCRIPT
// JWT AUTHENTICATION
// ============================================

const API_URL = "http://127.0.0.1:5000";

document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");

    if (!loginForm) {
        console.error("Login form not found.");
        return;
    }

    loginForm.addEventListener("submit", handleLogin);
});


// ============================================
// LOGIN FUNCTION
// ============================================

async function handleLogin(event) {
    event.preventDefault();

    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const roleInput = document.getElementById("role");

    const username = usernameInput ? usernameInput.value.trim() : "";
    const password = passwordInput ? passwordInput.value : "";
    const role = roleInput ? roleInput.value : "";

    // --------------------------------------------
    // Validation
    // --------------------------------------------

    if (!username || !password || !role) {
        showLoginMessage("Please enter username, password and select role.", "error");
        return;
    }

    // --------------------------------------------
    // Disable login button
    // --------------------------------------------

    const loginButton =
        document.querySelector('button[type="submit"]') ||
        document.getElementById("loginButton");

    const originalButtonText = loginButton
        ? loginButton.textContent
        : "";

    if (loginButton) {
        loginButton.disabled = true;
        loginButton.textContent = "Logging in...";
    }

    try {
        // --------------------------------------------
        // Send login request
        // --------------------------------------------

        const response = await fetch(`${API_URL}/api/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username,
                password,
                role
            })
        });

        const data = await response.json();

        console.log("Login response:", data);

        if (!response.ok || !data.success) {
            throw new Error(
                data.message || "Invalid username, password or role."
            );
        }

        // --------------------------------------------
        // Clear old login information
        // --------------------------------------------

        localStorage.removeItem("erpgenToken");
        localStorage.removeItem("erpgenUser");
        localStorage.removeItem("erpgenRole");
        localStorage.removeItem("erpgenLoggedIn");
        localStorage.removeItem("erpgenStudentRRN");

        // --------------------------------------------
        // Save JWT token
        // --------------------------------------------

        localStorage.setItem("erpgenToken", data.token);

        // --------------------------------------------
        // Save complete user object
        // --------------------------------------------

        localStorage.setItem(
            "erpgenUser",
            JSON.stringify(data.user)
        );

        // --------------------------------------------
        // Save role
        // --------------------------------------------

        localStorage.setItem(
            "erpgenRole",
            data.user.role
        );

        // --------------------------------------------
        // Login status
        // --------------------------------------------

        localStorage.setItem(
            "erpgenLoggedIn",
            "true"
        );

        // --------------------------------------------
        // Save student RRN
        // --------------------------------------------
        // This is important for the Student Dashboard.

        if (data.user.role === "student" && data.user.rrn) {
            localStorage.setItem(
                "erpgenStudentRRN",
                data.user.rrn ||data.user.rrnNo || ""
            );
        }

        // --------------------------------------------
        // Success message
        // --------------------------------------------

        showLoginMessage(
            "Login successful! Redirecting...",
            "success"
        );

        // --------------------------------------------
        // Redirect according to role
        // --------------------------------------------

        setTimeout(() => {

            if (data.user.role === "admin") {

                window.location.href = "dashboard.html";

            } else if (data.user.role === "faculty") {

                window.location.href = "faculty-dashboard.html";

            } else if (data.user.role === "student") {

                window.location.href = "student-dashboard.html";

            } else {

                alert("Unknown user role.");
                logoutAndStayOnLogin();

            }

        }, 700);

    } catch (error) {

        console.error("Login error:", error);

        showLoginMessage(
            error.message || "Unable to login. Please try again.",
            "error"
        );

    } finally {

        if (loginButton) {
            loginButton.disabled = false;
            loginButton.textContent =
                originalButtonText || "Login";
        }
    }
}


// ============================================
// LOGIN MESSAGE
// ============================================

function showLoginMessage(message, type) {

    let messageElement =
        document.getElementById("loginMessage");

    // If message element does not exist,
    // create one automatically.

    if (!messageElement) {

        messageElement = document.createElement("div");

        messageElement.id = "loginMessage";

        const form =
            document.getElementById("loginForm");

        if (form) {
            form.prepend(messageElement);
        } else {
            document.body.prepend(messageElement);
        }
    }

    messageElement.textContent = message;

    messageElement.className =
        `login-message ${type}`;

    if (type === "error") {
        messageElement.style.color = "red";
    }

    if (type === "success") {
        messageElement.style.color = "green";
    }
}


// ============================================
// LOGOUT HELPER
// ============================================

function logoutAndStayOnLogin() {

    localStorage.removeItem("erpgenToken");
    localStorage.removeItem("erpgenUser");
    localStorage.removeItem("erpgenRole");
    localStorage.removeItem("erpgenLoggedIn");
    localStorage.removeItem("erpgenStudentRRN");

    window.location.href = "index.html";
}