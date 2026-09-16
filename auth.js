// ============================================
// TGPCET ERP - JWT AUTHENTICATION HELPER
// ============================================


// Get JWT token
function getAuthToken() {

    return localStorage.getItem("erpgenToken");

}


// Get logged-in user
function getLoggedInUser() {

    const userData = localStorage.getItem("erpgenUser");

    if (!userData) {
        return null;
    }

    try {

        return JSON.parse(userData);

    } catch (error) {

        console.error("Invalid user data.");

        return null;
    }

}


// Check login status
function isLoggedIn() {

    return !!getAuthToken();

}


// Logout
function logoutUser() {

    localStorage.removeItem("erpgenToken");
    localStorage.removeItem("erpgenUser");
    localStorage.removeItem("erpgenRole");
    localStorage.removeItem("erpgenLoggedIn");

    window.location.href = "index.html";

}


// Authenticated API request
async function authFetch(url, options = {}) {

    const token = getAuthToken();


    // No token
    if (!token) {

        alert(
            "Your session has expired. Please login again."
        );

        window.location.href = "index.html";

        throw new Error(
            "Authentication token not found."
        );
    }


    // Copy existing headers
    const headers = {
        ...(options.headers || {})
    };


    // Add JWT
    headers["Authorization"] =
        `Bearer ${token}`;


    // Add JSON content type when body exists
    if (
        options.body &&
        !headers["Content-Type"]
    ) {

        headers["Content-Type"] =
            "application/json";
    }


    // Send request
    const response = await fetch(
        url,
        {
            ...options,
            headers: headers
        }
    );


    // JWT expired or invalid
    if (response.status === 401) {

        localStorage.removeItem("erpgenToken");
        localStorage.removeItem("erpgenUser");
        localStorage.removeItem("erpgenRole");
        localStorage.removeItem("erpgenLoggedIn");

        alert(
            "Your session has expired. Please login again."
        );

        window.location.href = "index.html";

        throw new Error(
            "Authentication expired."
        );
    }


    return response;

}