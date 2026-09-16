// ============================================================
// TGPCET ERP - STUDENT DASHBOARD
// ============================================================

const API_URL = "http://localhost:5000";


// ============================================================
// PAGE LOAD
// ============================================================

document.addEventListener("DOMContentLoaded", () => {

    console.log("======================================");
    console.log("TGPCET ERP STUDENT DASHBOARD");
    console.log("Student Dashboard JS Loaded");
    console.log("======================================");

    initializeStudentDashboard();

});


// ============================================================
// INITIALIZE
// ============================================================

async function initializeStudentDashboard() {

    const loggedIn =
        localStorage.getItem("erpgenLoggedIn");

    const role =
        localStorage.getItem("erpgenRole");

    const token =
        localStorage.getItem("erpgenToken");


    console.log("Logged in:", loggedIn);
    console.log("Role:", role);
    console.log("Token exists:", !!token);


    // --------------------------------------------------------
    // AUTHENTICATION CHECK
    // --------------------------------------------------------

    if (
        loggedIn !== "true" ||
        role !== "student" ||
        !token
    ) {

        console.warn(
            "Student authentication failed."
        );

        window.location.href =
            "index.html";

        return;

    }


    // --------------------------------------------------------
    // USER
    // --------------------------------------------------------

    const user =
        getUser();


    console.log(
        "Logged-in user:",
        user
    );


    if (!user) {

        alert(
            "Student login information is missing."
        );

        clearLoginData();

        window.location.href =
            "index.html";

        return;

    }


    // --------------------------------------------------------
    // DISPLAY USER
    // --------------------------------------------------------

    displayUser(user);


    // --------------------------------------------------------
    // GET RRN
    // --------------------------------------------------------

    const rrn =
        getStudentRRN(user);


    console.log(
        "Student RRN:",
        rrn
    );


    if (!rrn) {

        showRRNError();

        return;

    }


    // --------------------------------------------------------
    // RRN INPUT
    // --------------------------------------------------------

    const rrnInput =
        document.getElementById(
            "rrnInput"
        );


    if (rrnInput) {

        rrnInput.value =
            rrn;

        rrnInput.readOnly =
            true;

    }


    // --------------------------------------------------------
    // BUTTON
    // --------------------------------------------------------

    const button =
        document.getElementById(
            "viewDetailsBtn"
        );


    if (button) {

        button.addEventListener(
            "click",
            () => {

                loadStudent(rrn);

            }
        );

    }


    // --------------------------------------------------------
    // LOGOUT
    // --------------------------------------------------------

    const logoutButton =
        document.getElementById(
            "logoutBtn"
        );


    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            logoutStudent
        );

    }


    // --------------------------------------------------------
    // AUTOMATICALLY LOAD
    // --------------------------------------------------------

    await loadStudent(rrn);

}


// ============================================================
// GET USER
// ============================================================

function getUser() {

    const storedUser =
        localStorage.getItem(
            "erpgenUser"
        );


    if (!storedUser) {

        return null;

    }


    try {

        return JSON.parse(
            storedUser
        );

    }

    catch (error) {

        console.error(
            "Could not parse user:",
            error
        );

        return null;

    }

}


// ============================================================
// GET STUDENT RRN
// ============================================================

function getStudentRRN(user) {

    let rrn = "";


    if (
        user &&
        user.rrn
    ) {

        rrn =
            user.rrn;

    }

    else if (
        user &&
        user.rrnNo
    ) {

        rrn =
            user.rrnNo;

    }

    else {

        rrn =
            localStorage.getItem(
                "erpgenStudentRRN"
            ) || "";

    }


    return String(
        rrn
    )
    .trim()
    .toUpperCase();

}


// ============================================================
// DISPLAY USER
// ============================================================

function displayUser(user) {

    const element =
        document.getElementById(
            "loggedInUser"
        );


    if (element) {

        element.textContent =
            user.fullName ||
            user.username ||
            "Student";

    }

}


// ============================================================
// LOAD STUDENT
// ============================================================

async function loadStudent(rrn) {

    if (!rrn) {

        showRRNError();

        return;

    }


    console.log(
        "Loading student:",
        rrn
    );


    // IMPORTANT:
    // This no longer destroys studentDetails HTML.
    showLoading();


    const button =
        document.getElementById(
            "viewDetailsBtn"
        );


    if (button) {

        button.disabled =
            true;

        button.textContent =
            "Loading...";

    }


    try {

        const token =
            localStorage.getItem(
                "erpgenToken"
            );


        if (!token) {

            throw new Error(
                "Authentication token not found."
            );

        }


        const url =
            `${API_URL}/api/students/rrn/${encodeURIComponent(rrn)}`;


        console.log(
            "Student API URL:",
            url
        );


        const response =
            await fetch(
                url,
                {

                    method: "GET",

                    headers: {

                        "Authorization":
                            `Bearer ${token}`,

                        "Content-Type":
                            "application/json"

                    }

                }
            );


        console.log(
            "Student API status:",
            response.status
        );


        // ----------------------------------------------------
        // UNAUTHORIZED
        // ----------------------------------------------------

        if (
            response.status === 401
        ) {

            clearLoginData();

            alert(
                "Your session has expired. Please login again."
            );

            window.location.href =
                "index.html";

            return;

        }


        // ----------------------------------------------------
        // NOT FOUND
        // ----------------------------------------------------

        if (
            response.status === 404
        ) {

            throw new Error(
                `Student ${rrn} was not found.`
            );

        }


        // ----------------------------------------------------
        // OTHER SERVER ERROR
        // ----------------------------------------------------

        if (!response.ok) {

            const errorText =
                await response.text();


            console.error(
                "Student API error:",
                errorText
            );


            throw new Error(
                `Server returned HTTP ${response.status}`
            );

        }


        // ----------------------------------------------------
        // READ JSON
        // ----------------------------------------------------

        const data =
            await response.json();


        console.log(
            "Student API response:",
            data
        );


        // ----------------------------------------------------
        // GET STUDENT
        // ----------------------------------------------------

        let student = null;


        if (
            data &&
            data.student
        ) {

            student =
                data.student;

        }

        else if (
            data &&
            data.data
        ) {

            student =
                data.data;

        }

        else if (
            data &&
            (
                data.fullName ||
                data.rrnNo ||
                data.rrn
            )
        ) {

            student =
                data;

        }


        if (!student) {

            throw new Error(
                "Student data was not returned by the server."
            );

        }


        console.log(
            "Student record:",
            student
        );


        // ----------------------------------------------------
        // SECURITY CHECK
        // ----------------------------------------------------

        const returnedRRN =
            String(
                student.rrnNo ||
                student.rrn ||
                ""
            )
            .trim()
            .toUpperCase();


        if (
            returnedRRN &&
            returnedRRN !== rrn
        ) {

            throw new Error(
                "Student record does not match your account."
            );

        }


        // ----------------------------------------------------
        // DISPLAY DATA
        // ----------------------------------------------------

        displayStudent(student);


        console.log(
            "Student details displayed successfully."
        );

    }

    catch (error) {

        console.error(
            "Student loading error:",
            error
        );


        showError(
            error.message
        );

    }

    finally {

        if (button) {

            button.disabled =
                false;

            button.textContent =
                "🔍 View My Details";

        }

    }

}


// ============================================================
// DISPLAY STUDENT
// ============================================================

function displayStudent(student) {

    console.log(
        "Displaying student data..."
    );


    // --------------------------------------------------------
    // WELCOME
    // --------------------------------------------------------

    const welcome =
        document.getElementById(
            "welcomeCard"
        );


    if (welcome) {

        welcome.style.display =
            "none";

    }


    // --------------------------------------------------------
    // DETAILS
    // --------------------------------------------------------

    const details =
        document.getElementById(
            "studentDetails"
        );


    if (!details) {

        console.error(
            "studentDetails element not found in HTML."
        );

        return;

    }


    details.style.display =
        "block";


    // --------------------------------------------------------
    // PERSONAL INFORMATION
    // --------------------------------------------------------

    setText(
        "studentName",
        student.fullName ||
        "-"
    );


    setText(
        "studentRRN",
        student.rrnNo ||
        student.rrn ||
        "-"
    );


    setText(
        "studentGender",
        formatGender(
            student.gender
        )
    );


    setText(
        "studentDepartment",
        student.department ||
        "-"
    );


    setText(
        "studentNationality",
        student.nationality ||
        "-"
    );


    setText(
        "studentFather",
        student.fatherFirstName ||
        "-"
    );


    setText(
        "studentMother",
        student.motherFirstName ||
        "-"
    );


    // --------------------------------------------------------
    // ACADEMIC
    // --------------------------------------------------------

    const cgpa =
        Number(
            student.cgpa
        );


    setText(
        "studentCGPA",
        Number.isFinite(cgpa)
            ? cgpa.toFixed(2)
            : "-"
    );


    setText(
        "studentGrade",
        student.grade ||
        "-"
    );


    setText(
        "studentExamEligibility",
        student.eligibleForExam ||
        "-"
    );


    // --------------------------------------------------------
    // ATTENDANCE
    // --------------------------------------------------------

    const present =
        Number(
            student.present
        ) || 0;


    const absent =
        Number(
            student.absent
        ) || 0;


    const attendance =
        calculateAttendance(
            present,
            absent
        );


    setText(
        "studentPresent",
        present
    );


    setText(
        "studentAbsent",
        absent
    );


    setText(
        "studentAttendance",
        attendance === null
            ? "-"
            : `${attendance}%`
    );


    // --------------------------------------------------------
    // ATTENDANCE STATUS
    // --------------------------------------------------------

    const attendanceStatus =
        document.getElementById(
            "attendanceStatus"
        );


    if (attendanceStatus) {

        if (
            attendance === null
        ) {

            attendanceStatus.textContent =
                "No attendance data";

            attendanceStatus.className =
                "status neutral";

        }

        else if (
            attendance >= 75
        ) {

            attendanceStatus.textContent =
                "✓ Attendance is 75% or above";

            attendanceStatus.className =
                "status success";

        }

        else {

            attendanceStatus.textContent =
                "⚠ Attendance is below 75%";

            attendanceStatus.className =
                "status warning";

        }

    }


    // --------------------------------------------------------
    // EXAM STATUS
    // --------------------------------------------------------

    const examStatus =
        document.getElementById(
            "examStatus"
        );


    if (examStatus) {

        const eligibility =
            normalizeEligibility(
                student.eligibleForExam
            );


        if (
            eligibility === "eligible"
        ) {

            examStatus.textContent =
                "✓ Eligible for Examination";

            examStatus.className =
                "status success";

        }

        else if (
            eligibility === "not eligible"
        ) {

            examStatus.textContent =
                "✕ Not Eligible for Examination";

            examStatus.className =
                "status danger";

        }

        else {

            examStatus.textContent =
                student.eligibleForExam ||
                "-";

            examStatus.className =
                "status neutral";

        }

    }


    // --------------------------------------------------------
    // RESULT MESSAGE
    // --------------------------------------------------------

    const message =
        document.getElementById(
            "resultMessage"
        );


    if (message) {

        message.textContent =
            "✓ Your ERP information has been loaded successfully.";

    }

}


// ============================================================
// LOADING
// ============================================================

function showLoading() {

    const welcome =
        document.getElementById(
            "welcomeCard"
        );


    if (welcome) {

        welcome.style.display =
            "none";

    }


    const details =
        document.getElementById(
            "studentDetails"
        );


    if (details) {

        details.style.display =
            "block";

    }


    const message =
        document.getElementById(
            "resultMessage"
        );


    if (message) {

        message.textContent =
            "⏳ Loading your ERP information...";

    }

}


// ============================================================
// ERROR
// ============================================================

function showError(message) {

    const welcome =
        document.getElementById(
            "welcomeCard"
        );


    if (welcome) {

        welcome.style.display =
            "none";

    }


    const details =
        document.getElementById(
            "studentDetails"
        );


    if (details) {

        details.style.display =
            "block";

    }


    const result =
        document.getElementById(
            "resultMessage"
        );


    if (result) {

        result.innerHTML = `

            <div class="error-message">

                ⚠️ ${escapeHTML(
                    message ||
                    "Unable to load student information."
                )}

            </div>

        `;

    }

}


// ============================================================
// RRN ERROR
// ============================================================

function showRRNError() {

    const welcome =
        document.getElementById(
            "welcomeCard"
        );


    if (welcome) {

        welcome.style.display =
            "none";

    }


    const details =
        document.getElementById(
            "studentDetails"
        );


    if (details) {

        details.style.display =
            "block";

    }


    const result =
        document.getElementById(
            "resultMessage"
        );


    if (result) {

        result.innerHTML = `

            <div class="error-message">

                ⚠️ Your student account does not have
                an RRN linked to it.

            </div>

        `;

    }

}


// ============================================================
// ATTENDANCE
// ============================================================

function calculateAttendance(
    present,
    absent
) {

    const p =
        Number(present) || 0;

    const a =
        Number(absent) || 0;


    const total =
        p + a;


    if (
        total <= 0
    ) {

        return null;

    }


    return Number(
        (
            p /
            total *
            100
        ).toFixed(2)
    );

}


// ============================================================
// GENDER
// ============================================================

function formatGender(
    value
) {

    const gender =
        String(
            value || ""
        )
        .trim()
        .toLowerCase();


    if (
        gender === "female" ||
        gender === "f"
    ) {

        return "Female";

    }


    if (
        gender === "male" ||
        gender === "m"
    ) {

        return "Male";

    }


    return value || "-";

}


// ============================================================
// ELIGIBILITY
// ============================================================

function normalizeEligibility(
    value
) {

    const text =
        String(
            value || ""
        )
        .trim()
        .toLowerCase();


    if (
        text === "eligible"
    ) {

        return "eligible";

    }


    if (
        text === "not eligible" ||
        text === "noteligible" ||
        text === "ineligible"
    ) {

        return "not eligible";

    }


    return text;

}


// ============================================================
// SET TEXT
// ============================================================

function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.textContent =
            value ?? "-";

    }

    else {

        console.warn(
            `Element #${id} not found.`
        );

    }

}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHTML(
    value
) {

    return String(
        value ?? ""
    )

    .replace(
        /&/g,
        "&amp;"
    )

    .replace(
        /</g,
        "&lt;"
    )

    .replace(
        />/g,
        "&gt;"
    )

    .replace(
        /"/g,
        "&quot;"
    )

    .replace(
        /'/g,
        "&#039;"
    );

}


// ============================================================
// LOGOUT
// ============================================================

function logoutStudent() {

    clearLoginData();

    window.location.href =
        "index.html";

}


function clearLoginData() {

    localStorage.removeItem(
        "erpgenToken"
    );

    localStorage.removeItem(
        "erpgenUser"
    );

    localStorage.removeItem(
        "erpgenRole"
    );

    localStorage.removeItem(
        "erpgenLoggedIn"
    );

    localStorage.removeItem(
        "erpgenStudentRRN"
    );

}


// ============================================================
// END
// ============================================================

console.log(
    "Student Dashboard JS ready."
);