// ============================================================
// TGPCET ERP - ADMIN DASHBOARD
// Conversational AI + Dynamic Dashboard
// ============================================================

const API_BASE_URL = "http://localhost:5000";

let departmentChartInstance = null;
let genderChartInstance = null;
let eligibilityChartInstance = null;
let cgpaChartInstance = null;
let dynamicQueryChartInstance = null;

let currentQueryData = null;

const QUERY_HISTORY_KEY = "erpgenQueryHistory";
const MAX_QUERY_HISTORY = 10;


// ============================================================
// PAGE LOAD
// ============================================================

document.addEventListener("DOMContentLoaded", async function () {

    console.log("====================================");
    console.log("TGPCET ERP ADMIN DASHBOARD");
    console.log("Dashboard JS Loaded");
    console.log("====================================");

    // Check login
    const loggedIn =
        localStorage.getItem("erpgenLoggedIn");

    const role =
        localStorage.getItem("erpgenRole");

    if (loggedIn !== "true" || role !== "admin") {

        if (role === "student") {
            window.location.href = "student-dashboard.html";
        }

        else if (role === "faculty") {
            window.location.href = "faculty-dashboard.html";
        }

        else {
            window.location.href = "index.html";
        }

        return;
    }

    console.log("Admin authentication passed.");

    loadUser();

    setupAISearch();

    setupLogout();

    setupQueryHistory();

    setupReportButtons();

    loadQueryHistory();

    await loadDashboardStats();

    await loadGlobalCharts();
});


// ============================================================
// AUTHENTICATED FETCH
// ============================================================

async function makeAuthenticatedRequest(url, options = {}) {

    const token =
        localStorage.getItem("erpgenToken");

    if (!token) {

        alert("Login session not found. Please login again.");

        clearLoginData();

        window.location.href = "index.html";

        throw new Error("Authentication token missing.");
    }

    const headers = {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`
    };

    if (options.body && !headers["Content-Type"]) {
        headers["Content-Type"] = "application/json";
    }

    const response =
        await fetch(url, {
            ...options,
            headers
        });

    // Token expired
    if (response.status === 401) {

        console.error("Authentication failed.");

        clearLoginData();

        alert("Your login session has expired. Please login again.");

        window.location.href = "index.html";

        throw new Error("Authentication expired.");
    }

    return response;
}


// ============================================================
// CLEAR LOGIN DATA
// ============================================================

function clearLoginData() {

    localStorage.removeItem("erpgenToken");
    localStorage.removeItem("erpgenUser");
    localStorage.removeItem("erpgenRole");
    localStorage.removeItem("erpgenLoggedIn");
    localStorage.removeItem("erpgenStudentRRN");
}


// ============================================================
// GET USER
// ============================================================

function loadUser() {

    let user = null;

    const storedUser =
        localStorage.getItem("erpgenUser");

    if (storedUser) {

        try {
            user = JSON.parse(storedUser);
        }

        catch (error) {
            console.error("Invalid user data:", error);
        }
    }

    const welcomeUser =
        document.getElementById("welcomeUser");

    if (welcomeUser) {

        welcomeUser.textContent =
            user?.fullName ||
            user?.username ||
            "Admin";
    }
}


// ============================================================
// DASHBOARD STATISTICS
// ============================================================

async function loadDashboardStats() {

    console.log("Loading dashboard statistics...");

    try {

        const response =
            await makeAuthenticatedRequest(
                `${API_BASE_URL}/api/stats`
            );

        console.log(
            "Stats response:",
            response.status
        );

        if (!response.ok) {

            const text = await response.text();

            console.error("Stats error:", text);

            throw new Error(
                `Stats API returned HTTP ${response.status}`
            );
        }

        const data =
            await response.json();

        console.log(
            "Stats data:",
            data
        );

        if (!data.success) {

            throw new Error(
                data.message || "Statistics API failed."
            );
        }

        const stats =
            data.statistics || {};

        setText(
            "studentCount",
            stats.totalStudents ?? 0
        );

        setText(
            "femaleStudentCount",
            stats.femaleStudents ?? 0
        );

        setText(
            "maleStudentCount",
            stats.maleStudents ?? 0
        );

        setText(
            "departmentCount",
            stats.departmentCount ?? 0
        );

        console.log("Dashboard statistics loaded successfully.");

    }

    catch (error) {

        console.error(
            "Dashboard statistics error:",
            error
        );

        setText("studentCount", "0");
        setText("femaleStudentCount", "0");
        setText("maleStudentCount", "0");
        setText("departmentCount", "0");
    }
}


// ============================================================
// LOAD GLOBAL CHARTS
// ============================================================

async function loadGlobalCharts() {

    console.log("Loading global charts...");

    if (typeof Chart === "undefined") {

        console.error(
            "Chart.js is NOT loaded."
        );

        return;
    }

    try {

        const response =
            await makeAuthenticatedRequest(
                `${API_BASE_URL}/api/stats`
            );

        if (!response.ok) {

            throw new Error(
                `Chart stats HTTP ${response.status}`
            );
        }

        const data =
            await response.json();

        if (!data.success) {

            throw new Error(
                data.message || "Chart data unavailable."
            );
        }

        const stats =
            data.statistics || {};

        createDepartmentChart(
            stats.departments || []
        );

        createGenderChart(
            stats.gender || []
        );

        createEligibilityChart(
            stats
        );

        createCGPAChart(
            stats.cgpaDistribution || []
        );

        console.log("Global charts loaded.");

    }

    catch (error) {

        console.error(
            "Global chart error:",
            error
        );
    }
}


// ============================================================
// DEPARTMENT CHART
// ============================================================

function createDepartmentChart(departments) {

    const canvas =
        document.getElementById("departmentChart");

    if (!canvas) {
        return;
    }

    if (departmentChartInstance) {
        departmentChartInstance.destroy();
    }

    const labels =
        departments.map(item =>
            item._id ||
            item.department ||
            "Unknown"
        );

    const values =
        departments.map(item =>
            Number(item.count || 0)
        );

    if (labels.length === 0) {

        console.warn(
            "No department chart data."
        );

        return;
    }

    departmentChartInstance =
        new Chart(canvas, {

            type: "bar",

            data: {

                labels: labels,

                datasets: [{
                    label: "Students",
                    data: values
                }]
            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                plugins: {

                    legend: {
                        display: false
                    }
                },

                scales: {

                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }
                }
            }
        });
}


// ============================================================
// GENDER CHART
// ============================================================

function createGenderChart(gender) {

    const canvas =
        document.getElementById("genderChart");

    if (!canvas) {
        return;
    }

    if (genderChartInstance) {
        genderChartInstance.destroy();
    }

    const labels =
        gender.map(item =>
            formatFilterValue(
                item._id || "Unknown"
            )
        );

    const values =
        gender.map(item =>
            Number(item.count || 0)
        );

    if (labels.length === 0) {
        return;
    }

    genderChartInstance =
        new Chart(canvas, {

            type: "doughnut",

            data: {

                labels: labels,

                datasets: [{
                    data: values
                }]
            },

            options: {

                responsive: true,

                maintainAspectRatio: false
            }
        });
}


// ============================================================
// ELIGIBILITY CHART
// ============================================================

function createEligibilityChart(stats) {

    const canvas =
        document.getElementById("eligibilityChart");

    if (!canvas) {
        return;
    }

    if (eligibilityChartInstance) {
        eligibilityChartInstance.destroy();
    }

    const eligible =
        Number(stats.examEligible || 0);

    const notEligible =
        Number(stats.examNotEligible || 0);

    eligibilityChartInstance =
        new Chart(canvas, {

            type: "doughnut",

            data: {

                labels: [
                    "Eligible",
                    "Not Eligible"
                ],

                datasets: [{
                    data: [
                        eligible,
                        notEligible
                    ]
                }]
            },

            options: {

                responsive: true,

                maintainAspectRatio: false
            }
        });
}


// ============================================================
// CGPA CHART
// ============================================================

function createCGPAChart(distribution) {

    const canvas =
        document.getElementById("cgpaChart");

    if (!canvas) {
        return;
    }

    if (cgpaChartInstance) {
        cgpaChartInstance.destroy();
    }

    if (!distribution.length) {
        return;
    }

    const sorted =
        [...distribution].sort(
            (a, b) =>
                Number(a._id) -
                Number(b._id)
        );

    const labels =
        sorted.map(item =>
            String(item._id)
        );

    const values =
        sorted.map(item =>
            Number(item.count || 0)
        );

    cgpaChartInstance =
        new Chart(canvas, {

            type: "bar",

            data: {

                labels: labels,

                datasets: [{
                    label: "Students",
                    data: values
                }]
            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                scales: {

                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }
                }
            }
        });
}


// ============================================================
// AI SEARCH
// ============================================================

function setupAISearch() {

    const button =
        document.getElementById("searchBtn");

    const input =
        document.getElementById("queryInput");

    console.log("AI button:", button);
    console.log("AI input:", input);

    if (button) {

        button.addEventListener(
            "click",
            handleAIQuery
        );
    }

    if (input) {

        input.addEventListener(
            "keydown",
            function (event) {

                if (event.key === "Enter") {

                    event.preventDefault();

                    handleAIQuery();
                }
            }
        );
    }
}


// ============================================================
// HANDLE AI QUERY
// ============================================================

async function handleAIQuery() {

    const input =
        document.getElementById("queryInput");

    const button =
        document.getElementById("searchBtn");

    const result =
        document.getElementById("queryResult");

    const status =
        document.getElementById("resultStatus");

    if (!input) {

        console.error(
            "queryInput not found."
        );

        return;
    }

    const query =
        input.value.trim();

    if (!query) {

        if (result) {

            result.innerHTML = `
                <div class="empty-result">
                    <div class="empty-icon">✦</div>
                    <h3>Please enter a query</h3>
                    <p>
                        Example:
                        Show Information Technology students
                    </p>
                </div>
            `;
        }

        return;
    }

    if (button) {

        button.disabled = true;
        button.textContent = "Searching...";
    }

    if (status) {
        status.textContent = "Processing...";
    }

    if (result) {

        result.innerHTML = `
            <div class="empty-result">
                <div class="empty-icon">⏳</div>
                <h3>Processing your query...</h3>
                <p>AI is understanding your request.</p>
            </div>
        `;
    }

    try {

        console.log(
            "Sending query:",
            query
        );

        const response =
            await makeAuthenticatedRequest(
                `${API_BASE_URL}/api/query`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        query: query
                    })
                }
            );

        console.log(
            "AI response status:",
            response.status
        );

        if (!response.ok) {

            const errorText =
                await response.text();

            console.error(
                "AI API error:",
                errorText
            );

            throw new Error(
                `AI API HTTP ${response.status}`
            );
        }

        const data =
            await response.json();

        console.log(
            "AI result:",
            data
        );

        data.query = query;

        if (!data.success) {

            throw new Error(
                data.message ||
                "AI query failed."
            );
        }

        currentQueryData = data;

        saveQueryToHistory(
            query,
            data
        );

        displayQueryResult(data);

    }

    catch (error) {

        console.error(
            "AI Query Error:",
            error
        );

        displayError(
            error.message
        );
    }

    finally {

        if (button) {

            button.disabled = false;
            button.textContent = "Search";
        }

        if (status) {
            status.textContent = "Result";
        }
    }
}


// ============================================================
// DISPLAY QUERY RESULT
// ============================================================

function displayQueryResult(data) {

    const result =
        document.getElementById("queryResult");

    if (!result) {
        return;
    }

    const students =
        Array.isArray(data.students)
            ? data.students
            : [];

    updateDynamicQueryDashboard(data);

    showReportButtons(data);

    let title =
        "ERP Query Results";

    switch (data.intent) {

        case "STUDENT_COUNT":
            title = "Total Students";
            break;

        case "FEMALE_STUDENTS":
            title = "Female Students";
            break;

        case "MALE_STUDENTS":
            title = "Male Students";
            break;

        case "STUDENT_BY_RRN":
            title = "Student Details";
            break;

        case "DEPARTMENT_STUDENTS":
            title =
                `${data.department || "Department"} Students`;
            break;

        case "STUDENT_SEARCH":
            title = "Advanced Student Search";
            break;

        case "CGPA_STUDENTS":
            title = `Students with CGPA ${data.cgpa || ""}`;
            break;

        case "GRADE_STUDENTS":
            title = `Students with Grade ${data.grade || ""}`;
            break;

        case "ATTENDANCE_STUDENTS":
            title = "Attendance Results";
            break;

        case "EXAM_ELIGIBLE_STUDENTS":
            title = "Exam Eligibility Results";
            break;
    }

    // Student count query
    if (data.intent === "STUDENT_COUNT") {

        result.innerHTML = `

            <div class="result-card-inner">

                <div class="result-header">

                    <h3>
                        ${escapeHTML(title)}
                    </h3>

                </div>

                <div class="big-result-number">
                    ${Number(data.count || 0)}
                </div>

                <p>
                    Total students available in the ERP database.
                </p>

            </div>
        `;
    }

    else {

        result.innerHTML =
            createStudentTableResult(
                title,
                students
            );
    }

    if (data.aiInsight) {

        result.insertAdjacentHTML(
            "beforeend",
            displayAIInsight(
                data.aiInsight
            )
        );
    }
}


// ============================================================
// STUDENT TABLE
// ============================================================

function createStudentTableResult(
    title,
    students
) {

    if (!students.length) {

        return `

            <div class="result-card-inner">

                <div class="result-header">
                    <h3>
                        ${escapeHTML(title)}
                    </h3>
                </div>

                <p>
                    No students found.
                </p>

            </div>
        `;
    }

    let rows = "";

    students.forEach(
        function (student, index) {

            const present =
                Number(student.present || 0);

            const absent =
                Number(student.absent || 0);

            const attendance =
                student.attendance !== undefined
                    ? Number(student.attendance).toFixed(1)
                    : calculateAttendance(
                        present,
                        absent
                    );

            rows += `

                <tr>

                    <td>${index + 1}</td>

                    <td>
                        ${escapeHTML(
                            student.fullName || "-"
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            student.rrnNo ||
                            student.rrn ||
                            "-"
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            student.gender || "-"
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            student.department || "-"
                        )}
                    </td>

                    <td>
                        ${student.cgpa ?? "-"}
                    </td>

                    <td>
                        ${attendance}%
                    </td>

                    <td>
                        ${escapeHTML(
                            student.grade || "-"
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            student.eligibleForExam || "-"
                        )}
                    </td>

                </tr>
            `;
        }
    );

    return `

        <div class="result-card-inner">

            <div class="result-header">

                <div>

                    <h3>
                        ${escapeHTML(title)}
                    </h3>

                    <p>
                        Total Records:
                        <strong>${students.length}</strong>
                    </p>

                </div>

            </div>

            <div class="table-wrapper">

                <table class="student-result-table">

                    <thead>

                        <tr>

                            <th>#</th>
                            <th>Student Name</th>
                            <th>RRN</th>
                            <th>Gender</th>
                            <th>Department</th>
                            <th>CGPA</th>
                            <th>Attendance</th>
                            <th>Grade</th>
                            <th>Exam Eligibility</th>

                        </tr>

                    </thead>

                    <tbody>
                        ${rows}
                    </tbody>

                </table>

            </div>

        </div>
    `;
}


// ============================================================
// DYNAMIC QUERY DASHBOARD
// ============================================================

function updateDynamicQueryDashboard(data) {

    const section =
        document.getElementById(
            "dynamicQuerySection"
        );

    if (!section) {
        return;
    }

    section.style.display = "block";

    const queryText =
        document.getElementById(
            "dynamicQueryText"
        );

    if (queryText) {
        queryText.textContent =
            data.query || "Current ERP Query";
    }

    const badge =
        document.getElementById(
            "dynamicQueryBadge"
        );

    if (badge) {

        badge.textContent =
            getIntentTitle(data.intent);
    }

    const students =
        Array.isArray(data.students)
            ? data.students
            : [];

    const count =
        data.count !== undefined
            ? Number(data.count)
            : students.length;

    updateStatistic(
        "dynamicStudentCount",
        count
    );

    const averageCGPA =
        data.averageCGPA !== undefined
            ? Number(data.averageCGPA).toFixed(2)
            : calculateAverageCGPA(students);

    updateStatistic(
        "dynamicAverageCGPA",
        averageCGPA
    );

    const department =
        document.getElementById(
            "dynamicDepartment"
        );

    if (department) {

        department.textContent =
            data.department ||
            data.filters?.department ||
            getMostCommonDepartment(students) ||
            "Multiple";
    }

    displayAppliedFilters(data);

    const chartInfo =
        getDynamicChartInfo(data);

    const chartTitle =
        document.getElementById(
            "dynamicChartTitle"
        );

    const chartDescription =
        document.getElementById(
            "dynamicChartDescription"
        );

    if (chartTitle) {
        chartTitle.textContent =
            chartInfo.title;
    }

    if (chartDescription) {
        chartDescription.textContent =
            chartInfo.description;
    }

    createDynamicQueryChart(
        data,
        chartInfo
    );

    createDynamicQueryTable(
        students
    );
}


// ============================================================
// DYNAMIC CHART INFORMATION
// ============================================================

function getDynamicChartInfo(data) {

    switch (data.intent) {

        case "STUDENT_COUNT":

            return {
                type: "doughnut",
                title: "Total Student Overview",
                description:
                    "Total number of students in the ERP database."
            };

        case "FEMALE_STUDENTS":

            return {
                type: "bar",
                title: "Female Students by Department",
                description:
                    "Department-wise female student distribution."
            };

        case "MALE_STUDENTS":

            return {
                type: "bar",
                title: "Male Students by Department",
                description:
                    "Department-wise male student distribution."
            };

        case "DEPARTMENT_STUDENTS":

            return {
                type: "doughnut",
                title: "Gender Distribution",
                description:
                    "Gender distribution within the selected department."
            };

        case "STUDENT_SEARCH":

            return {
                type: "bar",
                title: "Filtered Student Distribution",
                description:
                    "Visualization of students matching the query."
            };

        case "CGPA_STUDENTS":

            return {
                type: "bar",
                title: "CGPA Distribution",
                description:
                    "CGPA distribution of matching students."
            };

        case "ATTENDANCE_STUDENTS":

            return {
                type: "doughnut",
                title: "Attendance Distribution",
                description:
                    "Attendance groups among matching students."
            };

        case "EXAM_ELIGIBLE_STUDENTS":

            return {
                type: "doughnut",
                title: "Exam Eligibility",
                description:
                    "Exam eligibility distribution."
            };

        case "GRADE_STUDENTS":

            return {
                type: "bar",
                title: "Grade Distribution",
                description:
                    "Grade distribution of matching students."
            };

        case "STUDENT_BY_RRN":

            return {
                type: "bar",
                title: "Student Details",
                description:
                    "Attendance and academic details."
            };

        default:

            return {
                type: "bar",
                title: "Query Result",
                description:
                    "Visualization of the ERP query results."
            };
    }
}


// ============================================================
// DYNAMIC QUERY CHART
// ============================================================

function createDynamicQueryChart(
    data,
    chartInfo
) {

    const canvas =
        document.getElementById(
            "dynamicQueryChart"
        );

    if (!canvas || typeof Chart === "undefined") {
        return;
    }

    if (dynamicQueryChartInstance) {

        dynamicQueryChartInstance.destroy();

        dynamicQueryChartInstance = null;
    }

    const students =
        Array.isArray(data.students)
            ? data.students
            : [];

    let labels = [];
    let values = [];

    let chartType =
        chartInfo.type || "bar";

    let datasetLabel =
        chartInfo.title || "Students";


    // --------------------------------------------------------
    // TOTAL
    // --------------------------------------------------------

    if (data.intent === "STUDENT_COUNT") {

        labels = ["Students"];

        values = [
            Number(data.count || 0)
        ];

        chartType = "doughnut";
    }


    // --------------------------------------------------------
    // FEMALE / MALE
    // --------------------------------------------------------

    else if (
        data.intent === "FEMALE_STUDENTS" ||
        data.intent === "MALE_STUDENTS"
    ) {

        const counts =
            countByDepartment(students);

        labels = Object.keys(counts);

        values = Object.values(counts);

        chartType = "bar";
    }


    // --------------------------------------------------------
    // DEPARTMENT
    // --------------------------------------------------------

    else if (
        data.intent === "DEPARTMENT_STUDENTS"
    ) {

        const counts =
            countByGender(students);

        labels = Object.keys(counts);

        values = Object.values(counts);

        chartType = "doughnut";
    }


    // --------------------------------------------------------
    // CGPA
    // --------------------------------------------------------

    else if (
        data.intent === "CGPA_STUDENTS"
    ) {

        const counts =
            countByCGPA(students);

        labels = Object.keys(counts);

        values = Object.values(counts);

        chartType = "bar";
    }


    // --------------------------------------------------------
    // GRADE
    // --------------------------------------------------------

    else if (
        data.intent === "GRADE_STUDENTS"
    ) {

        const counts =
            countByGrade(students);

        labels = Object.keys(counts);

        values = Object.values(counts);

        chartType = "bar";
    }


    // --------------------------------------------------------
    // ELIGIBILITY
    // --------------------------------------------------------

    else if (
        data.intent === "EXAM_ELIGIBLE_STUDENTS"
    ) {

        const counts =
            countByEligibility(students);

        labels = Object.keys(counts);

        values = Object.values(counts);

        chartType = "doughnut";
    }


    // --------------------------------------------------------
    // ATTENDANCE
    // --------------------------------------------------------

    else if (
        data.intent === "ATTENDANCE_STUDENTS"
    ) {

        const groups =
            groupByAttendance(students);

        labels = Object.keys(groups);

        values = Object.values(groups);

        chartType = "doughnut";
    }


    // --------------------------------------------------------
    // RRN
    // --------------------------------------------------------

    else if (
        data.intent === "STUDENT_BY_RRN"
    ) {

        const student =
            students[0];

        if (student) {

            labels = [
                "Present",
                "Absent",
                "CGPA"
            ];

            values = [
                Number(student.present || 0),
                Number(student.absent || 0),
                Number(student.cgpa || 0)
            ];
        }

        chartType = "bar";
    }


    // --------------------------------------------------------
    // ADVANCED SEARCH
    // --------------------------------------------------------

    else {

        const counts =
            countByDepartment(students);

        labels = Object.keys(counts);

        values = Object.values(counts);

        chartType = "bar";
    }


    if (!labels.length) {

        labels = ["No Data"];
        values = [0];
    }


    dynamicQueryChartInstance =
        new Chart(canvas, {

            type: chartType,

            data: {

                labels: labels,

                datasets: [{

                    label: datasetLabel,

                    data: values
                }]
            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                plugins: {

                    legend: {
                        display:
                            chartType !== "bar"
                    }
                },

                scales:
                    chartType === "bar"
                        ? {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    precision: 0
                                }
                            }
                        }
                        : {}
            }
        });
}


// ============================================================
// APPLIED FILTERS
// ============================================================

function displayAppliedFilters(data) {

    const summary =
        document.getElementById(
            "dynamicQuerySummary"
        );

    if (!summary) {
        return;
    }

    const old =
        summary.querySelector(
            ".applied-filters"
        );

    if (old) {
        old.remove();
    }

    const filters =
        data.filters;

    if (!filters) {
        return;
    }

    const items = [];

    if (
        filters.gender &&
        filters.gender !== "UNKNOWN"
    ) {

        items.push(
            `Gender: ${formatFilterValue(filters.gender)}`
        );
    }

    if (filters.department) {

        items.push(
            `Department: ${filters.department}`
        );
    }

    if (
        filters.grade &&
        filters.grade !== "UNKNOWN"
    ) {

        items.push(
            `Grade: ${filters.grade}`
        );
    }

    if (
        filters.cgpa &&
        filters.cgpaOperator &&
        filters.cgpaOperator !== "UNKNOWN"
    ) {

        items.push(
            `CGPA: ${getCGPAFilterText(
                filters.cgpaOperator,
                filters.cgpa
            )}`
        );
    }

    if (
        filters.eligibleForExam &&
        filters.eligibleForExam !== "UNKNOWN"
    ) {

        items.push(
            `Exam: ${formatFilterValue(
                filters.eligibleForExam
            )}`
        );
    }

    if (
        filters.attendanceCondition &&
        filters.attendanceCondition !== "UNKNOWN"
    ) {

        items.push(
            `Attendance: ${getAttendanceFilterText(
                filters.attendanceCondition
            )}`
        );
    }

    if (filters.rrn) {

        items.push(
            `RRN: ${filters.rrn}`
        );
    }

    if (!items.length) {
        return;
    }

    const container =
        document.createElement("div");

    container.className =
        "applied-filters";

    container.innerHTML = `

        <div class="applied-filters-title">
            Applied Filters
        </div>

        <div class="filter-badges">

            ${items.map(item => `
                <span class="filter-badge">
                    ${escapeHTML(item)}
                </span>
            `).join("")}

        </div>
    `;

    summary.appendChild(container);
}


// ============================================================
// DYNAMIC TABLE
// ============================================================

function createDynamicQueryTable(students) {

    const wrapper =
        document.getElementById(
            "dynamicTableWrapper"
        );

    const countElement =
        document.getElementById(
            "dynamicTableCount"
        );

    const container =
        document.getElementById(
            "dynamicQueryTable"
        );

    if (!wrapper || !container) {
        return;
    }

    wrapper.style.display = "block";

    if (countElement) {

        countElement.textContent =
            `${students.length} record${
                students.length === 1 ? "" : "s"
            }`;
    }

    if (!students.length) {

        container.innerHTML = `
            <div class="dynamic-empty">
                <div>📋</div>
                <p>No student records found.</p>
            </div>
        `;

        return;
    }

    let rows = "";

    students.forEach(
        function (student, index) {

            rows += `

                <tr>

                    <td>${index + 1}</td>

                    <td>
                        ${escapeHTML(
                            student.fullName || "-"
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            student.rrnNo ||
                            student.rrn ||
                            "-"
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            student.gender || "-"
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            student.department || "-"
                        )}
                    </td>

                    <td>
                        ${student.cgpa ?? "-"}
                    </td>

                    <td>
                        ${escapeHTML(
                            student.grade || "-"
                        )}
                    </td>

                </tr>
            `;
        }
    );

    container.innerHTML = `

        <div class="table-wrapper">

            <table class="dynamic-result-table">

                <thead>

                    <tr>
                        <th>#</th>
                        <th>Student Name</th>
                        <th>RRN</th>
                        <th>Gender</th>
                        <th>Department</th>
                        <th>CGPA</th>
                        <th>Grade</th>
                    </tr>

                </thead>

                <tbody>
                    ${rows}
                </tbody>

            </table>

        </div>
    `;
}


// ============================================================
// QUERY HISTORY
// ============================================================

function setupQueryHistory() {

    const button =
        document.getElementById(
            "clearHistoryBtn"
        );

    if (button) {

        button.addEventListener(
            "click",
            clearQueryHistory
        );
    }
}


function getQueryHistory() {

    try {

        const data =
            localStorage.getItem(
                QUERY_HISTORY_KEY
            );

        if (!data) {
            return [];
        }

        const parsed =
            JSON.parse(data);

        return Array.isArray(parsed)
            ? parsed
            : [];

    }

    catch (error) {

        console.error(
            "History error:",
            error
        );

        return [];
    }
}


function saveQueryToHistory(
    query,
    data
) {

    let history =
        getQueryHistory();

    const normalized =
        query.trim().toLowerCase();

    history =
        history.filter(
            item =>
                item.query &&
                item.query.trim().toLowerCase() !== normalized
        );

    history.unshift({

        query: query.trim(),

        intent:
            data.intent || "UNKNOWN",

        count:
            data.count !== undefined
                ? data.count
                : Array.isArray(data.students)
                    ? data.students.length
                    : 0,

        timestamp:
            new Date().toISOString()
    });

    history =
        history.slice(
            0,
            MAX_QUERY_HISTORY
        );

    localStorage.setItem(
        QUERY_HISTORY_KEY,
        JSON.stringify(history)
    );

    renderQueryHistory(history);
}


function loadQueryHistory() {

    renderQueryHistory(
        getQueryHistory()
    );
}


function renderQueryHistory(history) {

    const container =
        document.getElementById(
            "queryHistoryList"
        );

    if (!container) {
        return;
    }

    if (!history.length) {

        container.innerHTML = `
            <div class="query-history-empty">
                <div class="history-empty-icon">🕘</div>
                <p>No recent queries yet.</p>
            </div>
        `;

        return;
    }

    container.innerHTML =
        history.map(
            function (item, index) {

                return `

                    <div class="query-history-item">

                        <div class="query-history-number">
                            ${index + 1}
                        </div>

                        <div class="query-history-content">

                            <div class="query-history-query">
                                ${escapeHTML(item.query)}
                            </div>

                            <div class="query-history-meta">

                                <span>
                                    ${getIntentTitle(item.intent)}
                                </span>

                                <span>
                                    ${item.count || 0} records
                                </span>

                            </div>

                        </div>

                        <button
                            type="button"
                            class="run-history-button"
                            data-index="${index}"
                        >
                            Run Again
                        </button>

                    </div>
                `;
            }
        ).join("");

    container
        .querySelectorAll(".run-history-button")
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    function () {

                        const index =
                            Number(
                                button.dataset.index
                            );

                        runHistoryQuery(index);
                    }
                );
            }
        );
}


async function runHistoryQuery(index) {

    const history =
        getQueryHistory();

    if (!history[index]) {
        return;
    }

    const input =
        document.getElementById(
            "queryInput"
        );

    if (input) {

        input.value =
            history[index].query;

        await handleAIQuery();
    }
}


function clearQueryHistory() {

    localStorage.removeItem(
        QUERY_HISTORY_KEY
    );

    renderQueryHistory([]);
}


// ============================================================
// REPORT BUTTONS
// ============================================================

function setupReportButtons() {

    const excel =
        document.getElementById(
            "downloadExcelBtn"
        );

    const pdf =
        document.getElementById(
            "downloadPDFBtn"
        );

    if (excel) {

        excel.addEventListener(
            "click",
            downloadExcelReport
        );
    }

    if (pdf) {

        pdf.addEventListener(
            "click",
            downloadPDFReport
        );
    }
}


function showReportButtons(data) {

    const container =
        document.getElementById(
            "reportButtons"
        );

    if (!container) {
        return;
    }

    const students =
        Array.isArray(data.students)
            ? data.students
            : [];

    container.style.display =
        students.length
            ? "flex"
            : "none";
}


// ============================================================
// EXCEL REPORT
// ============================================================

async function downloadExcelReport() {

    if (
        !currentQueryData ||
        !Array.isArray(currentQueryData.students) ||
        !currentQueryData.students.length
    ) {

        alert(
            "Run a query with student records first."
        );

        return;
    }

    try {

        const response =
            await makeAuthenticatedRequest(
                `${API_BASE_URL}/api/reports/excel`,
                {

                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({

                        title:
                            getReportTitle(
                                currentQueryData
                            ),

                        students:
                            currentQueryData.students
                    })
                }
            );

        if (!response.ok) {

            throw new Error(
                `Excel HTTP ${response.status}`
            );
        }

        const blob =
            await response.blob();

        downloadBlob(
            blob,
            createFileName(
                "ERP_Student_Report",
                "xlsx"
            )
        );
    }

    catch (error) {

        console.error(
            "Excel error:",
            error
        );

        alert(
            "Excel report failed: " +
            error.message
        );
    }
}


// ============================================================
// PDF REPORT
// ============================================================

async function downloadPDFReport() {

    if (
        !currentQueryData ||
        !Array.isArray(currentQueryData.students) ||
        !currentQueryData.students.length
    ) {

        alert(
            "Run a query with student records first."
        );

        return;
    }

    try {

        const response =
            await makeAuthenticatedRequest(
                `${API_BASE_URL}/api/reports/pdf`,
                {

                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({

                        title:
                            getReportTitle(
                                currentQueryData
                            ),

                        students:
                            currentQueryData.students
                    })
                }
            );

        if (!response.ok) {

            throw new Error(
                `PDF HTTP ${response.status}`
            );
        }

        const blob =
            await response.blob();

        downloadBlob(
            blob,
            createFileName(
                "ERP_Student_Report",
                "pdf"
            )
        );
    }

    catch (error) {

        console.error(
            "PDF error:",
            error
        );

        alert(
            "PDF report failed: " +
            error.message
        );
    }
}


// ============================================================
// HELPERS
// ============================================================

function calculateAttendance(
    present,
    absent
) {

    const total =
        Number(present || 0) +
        Number(absent || 0);

    if (total === 0) {
        return "0.0";
    }

    return (
        Number(present || 0) /
        total *
        100
    ).toFixed(1);
}


function calculateAverageCGPA(students) {

    if (!students.length) {
        return "0.00";
    }

    const values =
        students
            .map(
                student =>
                    Number(student.cgpa)
            )
            .filter(
                value =>
                    !Number.isNaN(value)
            );

    if (!values.length) {
        return "0.00";
    }

    const total =
        values.reduce(
            (sum, value) =>
                sum + value,
            0
        );

    return (
        total / values.length
    ).toFixed(2);
}


function getMostCommonDepartment(students) {

    if (!students.length) {
        return "";
    }

    const counts = {};

    students.forEach(
        student => {

            const department =
                student.department ||
                "Unknown";

            counts[department] =
                (counts[department] || 0) + 1;
        }
    );

    return Object.keys(counts)
        .sort(
            (a, b) =>
                counts[b] -
                counts[a]
        )[0];
}


function countByDepartment(students) {

    const counts = {};

    students.forEach(
        student => {

            const value =
                student.department ||
                "Unknown";

            counts[value] =
                (counts[value] || 0) + 1;
        }
    );

    return counts;
}


function countByGender(students) {

    const counts = {};

    students.forEach(
        student => {

            const value =
                formatFilterValue(
                    student.gender ||
                    "Unknown"
                );

            counts[value] =
                (counts[value] || 0) + 1;
        }
    );

    return counts;
}


function countByCGPA(students) {

    const counts = {};

    students.forEach(
        student => {

            const value =
                String(
                    student.cgpa ??
                    "Unknown"
                );

            counts[value] =
                (counts[value] || 0) + 1;
        }
    );

    const sorted = {};

    Object.keys(counts)
        .sort(
            (a, b) =>
                Number(a) -
                Number(b)
        )
        .forEach(
            key => {
                sorted[key] = counts[key];
            }
        );

    return sorted;
}


function countByGrade(students) {

    const counts = {};

    students.forEach(
        student => {

            const value =
                student.grade ||
                "Unknown";

            counts[value] =
                (counts[value] || 0) + 1;
        }
    );

    return counts;
}


function countByEligibility(students) {

    const counts = {};

    students.forEach(
        student => {

            const value =
                student.eligibleForExam ||
                "Unknown";

            counts[value] =
                (counts[value] || 0) + 1;
        }
    );

    return counts;
}


function groupByAttendance(students) {

    const groups = {

        "Below 50%": 0,

        "50% - 74%": 0,

        "75% - 89%": 0,

        "90% and above": 0
    };

    students.forEach(
        student => {

            const present =
                Number(student.present || 0);

            const absent =
                Number(student.absent || 0);

            const total =
                present + absent;

            if (!total) {
                return;
            }

            const percentage =
                present / total * 100;

            if (percentage < 50) {

                groups["Below 50%"]++;
            }

            else if (percentage < 75) {

                groups["50% - 74%"]++;
            }

            else if (percentage < 90) {

                groups["75% - 89%"]++;
            }

            else {

                groups["90% and above"]++;
            }
        }
    );

    return groups;
}


function formatFilterValue(value) {

    if (!value) {
        return "";
    }

    return String(value)
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(
            /\b\w/g,
            char => char.toUpperCase()
        );
}


function getCGPAFilterText(
    operator,
    value
) {

    switch (operator) {

        case "GREATER_THAN":
            return `Above ${value}`;

        case "GREATER_THAN_OR_EQUAL":
            return `${value} or above`;

        case "LESS_THAN":
            return `Below ${value}`;

        case "LESS_THAN_OR_EQUAL":
            return `${value} or below`;

        case "EQUAL":
            return `Exactly ${value}`;

        default:
            return String(value);
    }
}


function getAttendanceFilterText(condition) {

    switch (condition) {

        case "BELOW_75":
            return "Below 75%";

        case "ABOVE_OR_EQUAL_75":
            return "75% or above";

        default:
            return formatFilterValue(condition);
    }
}


function getIntentTitle(intent) {

    const titles = {

        STUDENT_COUNT:
            "Student Count",

        FEMALE_STUDENTS:
            "Female Students",

        MALE_STUDENTS:
            "Male Students",

        STUDENT_BY_RRN:
            "Student Details",

        STUDENT_SEARCH:
            "Advanced Student Search",

        DEPARTMENT_STUDENTS:
            "Department Students",

        CGPA_STUDENTS:
            "CGPA Analysis",

        EXAM_ELIGIBLE_STUDENTS:
            "Exam Eligibility",

        GRADE_STUDENTS:
            "Grade Analysis",

        ATTENDANCE_STUDENTS:
            "Attendance Analysis",

        UNKNOWN:
            "Query Analysis"
    };

    return titles[intent] ||
        "Query Analysis";
}


function updateStatistic(id, value) {

    const element =
        document.getElementById(id);

    if (element) {

        element.textContent =
            value ?? 0;
    }
}


function setText(id, value) {

    const element =
        document.getElementById(id);

    if (element) {

        element.textContent =
            value ?? 0;
    }
}


function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function displayAIInsight(insight) {

    if (!insight) {
        return "";
    }

    if (typeof insight === "string") {

        return `

            <section class="ai-insight-card">

                <div class="ai-insight-header">

                    <div class="ai-insight-icon">
                        ✦
                    </div>

                    <div>
                        <h2>AI Insight</h2>
                        <p>AI-generated explanation</p>
                    </div>

                </div>

                <div class="ai-insight-content">

                    <p>
                        ${escapeHTML(insight)}
                    </p>

                </div>

            </section>
        `;
    }

    const title =
        insight.title ||
        "AI Insight";

    const summary =
        insight.summary ||
        "";

    const observations =
        Array.isArray(insight.observations)
            ? insight.observations
            : [];

    return `

        <section class="ai-insight-card">

            <div class="ai-insight-header">

                <div class="ai-insight-icon">
                    ✦
                </div>

                <div>

                    <h2>
                        ${escapeHTML(title)}
                    </h2>

                    <p>
                        AI-generated explanation
                    </p>

                </div>

            </div>

            <div class="ai-insight-content">

                <p>
                    ${escapeHTML(summary)}
                </p>

                ${
                    observations.length
                        ? `
                            <h4>Key Observations</h4>

                            <ul>
                                ${observations
                                    .map(
                                        item =>
                                            `<li>${escapeHTML(item)}</li>`
                                    )
                                    .join("")}
                            </ul>
                        `
                        : ""
                }

            </div>

        </section>
    `;
}


function displayError(message) {

    const result =
        document.getElementById(
            "queryResult"
        );

    if (!result) {
        return;
    }

    result.innerHTML = `

        <div class="empty-result">

            <div class="empty-icon">
                ⚠️
            </div>

            <h3>
                Something went wrong
            </h3>

            <p>
                ${escapeHTML(message)}
            </p>

        </div>
    `;
}


// ============================================================
// REPORT HELPERS
// ============================================================

function getReportTitle(data) {

    if (!data) {
        return "ERP Student Report";
    }

    if (data.intent === "STUDENT_SEARCH") {
        return "Advanced Student Search Report";
    }

    switch (data.intent) {

        case "FEMALE_STUDENTS":
            return "Female Students Report";

        case "MALE_STUDENTS":
            return "Male Students Report";

        case "STUDENT_BY_RRN":
            return "Student Details Report";

        case "DEPARTMENT_STUDENTS":
            return "Department Students Report";

        case "CGPA_STUDENTS":
            return "CGPA Students Report";

        case "GRADE_STUDENTS":
            return "Grade Students Report";

        case "ATTENDANCE_STUDENTS":
            return "Attendance Report";

        case "EXAM_ELIGIBLE_STUDENTS":
            return "Exam Eligibility Report";

        default:
            return "ERP Student Report";
    }
}


function createFileName(
    title,
    extension
) {

    const safe =
        String(title)
            .replace(/[^a-z0-9]/gi, "_")
            .replace(/_+/g, "_");

    const date =
        new Date()
            .toISOString()
            .slice(0, 10);

    return `${safe}_${date}.${extension}`;
}


function downloadBlob(
    blob,
    fileName
) {

    const url =
        window.URL.createObjectURL(blob);

    const link =
        document.createElement("a");

    link.href = url;

    link.download = fileName;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    window.URL.revokeObjectURL(url);
}


// ============================================================
// QUICK QUERY
// ============================================================

function setQuery(query) {

    const input =
        document.getElementById(
            "queryInput"
        );

    if (input) {

        input.value = query;

        input.focus();
    }
}


// ============================================================
// FOCUS AI
// ============================================================

function focusAI() {

    const section =
        document.getElementById(
            "aiQuerySection"
        );

    const input =
        document.getElementById(
            "queryInput"
        );

    if (section) {

        section.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    }

    if (input) {

        setTimeout(
            () => input.focus(),
            500
        );
    }
}


// ============================================================
// SIDEBAR
// ============================================================

function toggleMenu(menuId) {

    const menu =
        document.getElementById(menuId);

    if (menu) {

        menu.classList.toggle("show");
    }
}


// ============================================================
// LOGOUT
// ============================================================

function setupLogout() {

    const button =
        document.getElementById(
            "logoutBtn"
        );

    if (!button) {
        return;
    }

    button.addEventListener(
        "click",
        function () {

            clearLoginData();

            window.location.href =
                "index.html";
        }
    );
}


// ============================================================
// END
// ============================================================

console.log(
    "TGPCET dashboard.js ready."
);