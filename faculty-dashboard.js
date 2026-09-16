// ============================================================
// TGPCET ERP - FACULTY DASHBOARD
// Complete JWT + MongoDB Student Dashboard
// ============================================================

const FACULTY_API_URL = "http://localhost:5000";


// ============================================================
// GLOBAL DATA
// ============================================================

let allStudents = [];
let filteredStudents = [];


// ============================================================
// PAGE LOAD
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log(
            "======================================"
        );

        console.log(
            "TGPCET ERP FACULTY DASHBOARD"
        );

        console.log(
            "Faculty Dashboard JS Loaded"
        );

        console.log(
            "======================================"
        );


        initializeFacultyDashboard();

    }
);


// ============================================================
// INITIALIZE
// ============================================================

async function initializeFacultyDashboard() {

    // --------------------------------------------------------
    // LOGIN CHECK
    // --------------------------------------------------------

    const loggedIn =
        localStorage.getItem(
            "erpgenLoggedIn"
        );

    const role =
        localStorage.getItem(
            "erpgenRole"
        );

    if (
        loggedIn !== "true" ||
        role !== "faculty"
    ) {

        alert(
            "Please login as Faculty to access this dashboard."
        );

        window.location.href =
            "index.html";

        return;
    }


    // --------------------------------------------------------
    // DISPLAY USER
    // --------------------------------------------------------

    displayFacultyUser();


    // --------------------------------------------------------
    // GET HTML ELEMENTS
    // --------------------------------------------------------

    setupFacultyEvents();


    // --------------------------------------------------------
    // LOAD STUDENTS
    // --------------------------------------------------------

    await loadStudents();

}


// ============================================================
// DISPLAY FACULTY USER
// ============================================================

function displayFacultyUser() {

    const element =
        document.getElementById(
            "loggedInUser"
        );

    if (!element) {
        return;
    }

    let user = null;

    const storedUser =
        localStorage.getItem(
            "erpgenUser"
        );

    if (storedUser) {

        try {

            user =
                JSON.parse(
                    storedUser
                );

        }

        catch (error) {

            console.error(
                "Unable to read faculty user:",
                error
            );

        }

    }

    element.textContent =
        user?.fullName ||
        user?.username ||
        "Faculty";

}


// ============================================================
// SETUP EVENTS
// ============================================================

function setupFacultyEvents() {

    const refreshBtn =
        document.getElementById(
            "refreshBtn"
        );

    const search =
        document.getElementById(
            "studentSearch"
        );

    const department =
        document.getElementById(
            "departmentFilter"
        );

    const gender =
        document.getElementById(
            "genderFilter"
        );

    const grade =
        document.getElementById(
            "gradeFilter"
        );

    const exportButton =
        document.getElementById(
            "downloadExcelBtn"
        );

    const logoutButton =
        document.getElementById(
            "logoutBtn"
        );


    // --------------------------------------------------------
    // REFRESH
    // --------------------------------------------------------

    if (refreshBtn) {

        refreshBtn.addEventListener(
            "click",
            async function () {

                await loadStudents();

            }
        );

    }


    // --------------------------------------------------------
    // SEARCH
    // --------------------------------------------------------

    if (search) {

        search.addEventListener(
            "input",
            applyFilters
        );

    }


    // --------------------------------------------------------
    // DEPARTMENT
    // --------------------------------------------------------

    if (department) {

        department.addEventListener(
            "change",
            applyFilters
        );

    }


    // --------------------------------------------------------
    // GENDER
    // --------------------------------------------------------

    if (gender) {

        gender.addEventListener(
            "change",
            applyFilters
        );

    }


    // --------------------------------------------------------
    // GRADE
    // --------------------------------------------------------

    if (grade) {

        grade.addEventListener(
            "change",
            applyFilters
        );

    }


    // --------------------------------------------------------
    // EXPORT
    // --------------------------------------------------------

    if (exportButton) {

        exportButton.addEventListener(
            "click",
            downloadExcel
        );

    }


    // --------------------------------------------------------
    // LOGOUT
    // --------------------------------------------------------

    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            logoutFaculty
        );

    }

}


// ============================================================
// AUTHENTICATED REQUEST
// ============================================================

async function facultyFetch(
    url,
    options = {}
) {

    const token =
        localStorage.getItem(
            "erpgenToken"
        );

    if (!token) {

        clearLoginData();

        alert(
            "Your login session has expired. Please login again."
        );

        window.location.href =
            "index.html";

        throw new Error(
            "Authentication token not found."
        );

    }


    const headers = {

        ...(options.headers || {}),

        Authorization:
            `Bearer ${token}`

    };


    if (
        options.body &&
        !headers["Content-Type"]
    ) {

        headers["Content-Type"] =
            "application/json";

    }


    const response =
        await fetch(
            url,
            {
                ...options,
                headers
            }
        );


    if (
        response.status === 401
    ) {

        clearLoginData();

        alert(
            "Your session has expired. Please login again."
        );

        window.location.href =
            "index.html";

        throw new Error(
            "Authentication expired."
        );

    }


    return response;

}


// ============================================================
// LOAD STUDENTS
// ============================================================

async function loadStudents() {

    showMessage(
        "Loading student data..."
    );


    const refreshBtn =
        document.getElementById(
            "refreshBtn"
        );


    if (refreshBtn) {

        refreshBtn.disabled =
            true;

        refreshBtn.textContent =
            "Loading...";

    }


    try {

        console.log(
            "Requesting student data..."
        );


        const response =
            await facultyFetch(
                `${FACULTY_API_URL}/api/students`
            );


        console.log(
            "Students API status:",
            response.status
        );


        if (!response.ok) {

            const errorText =
                await response.text();

            console.error(
                "Students API error:",
                errorText
            );

            throw new Error(
                `Student API returned HTTP ${response.status}`
            );

        }


        const data =
            await response.json();


        console.log(
            "Students API response:",
            data
        );


        // ----------------------------------------------------
        // SUPPORT MULTIPLE RESPONSE FORMATS
        // ----------------------------------------------------

        if (Array.isArray(data)) {

            allStudents =
                data;

        }

        else if (
            Array.isArray(data.students)
        ) {

            allStudents =
                data.students;

        }

        else if (
            data.data &&
            Array.isArray(data.data)
        ) {

            allStudents =
                data.data;

        }

        else {

            throw new Error(
                "Invalid student data format returned by server."
            );

        }


        console.log(
            "Students loaded:",
            allStudents.length
        );


        // ----------------------------------------------------
        // NORMALIZE DATA
        // ----------------------------------------------------

        allStudents =
            allStudents.map(
                normalizeStudent
            );


        // ----------------------------------------------------
        // COPY FOR DISPLAY
        // ----------------------------------------------------

        filteredStudents =
            [...allStudents];


        // ----------------------------------------------------
        // POPULATE DEPARTMENTS
        // ----------------------------------------------------

        populateDepartmentFilter();


        // ----------------------------------------------------
        // RESET FILTERS
        // ----------------------------------------------------

        resetFilters();


        // ----------------------------------------------------
        // UPDATE EVERYTHING
        // ----------------------------------------------------

        updateDashboardStatistics();

        renderStudentTable();

        hideMessage();


        console.log(
            "Faculty dashboard loaded successfully."
        );

    }

    catch (error) {

        console.error(
            "Faculty dashboard loading error:",
            error
        );


        showMessage(
            `Unable to load student data. ${error.message}`,
            "error"
        );


        renderEmptyTable(
            "Unable to load student records."
        );

    }

    finally {

        if (refreshBtn) {

            refreshBtn.disabled =
                false;

            refreshBtn.textContent =
                "🔄 Refresh";

        }

    }

}


// ============================================================
// NORMALIZE STUDENT
// ============================================================

function normalizeStudent(
    student
) {

    return {

        ...student,

        // Correct MongoDB field
        rrnNo:
            student.rrnNo ||
            student.rrn ||
            "",

        fullName:
            student.fullName ||
            "",

        gender:
            student.gender ||
            "",

        department:
            student.department ||
            "",

        grade:
            student.grade ||
            "",

        eligibleForExam:
            student.eligibleForExam ||
            "",

        present:
            Number(student.present) || 0,

        absent:
            Number(student.absent) || 0,

        cgpa:
            Number.isFinite(
                Number(student.cgpa)
            )
                ? Number(student.cgpa)
                : null

    };

}


// ============================================================
// RESET FILTERS
// ============================================================

function resetFilters() {

    const search =
        document.getElementById(
            "studentSearch"
        );

    const department =
        document.getElementById(
            "departmentFilter"
        );

    const gender =
        document.getElementById(
            "genderFilter"
        );

    const grade =
        document.getElementById(
            "gradeFilter"
        );


    if (search) {

        search.value =
            "";

    }


    if (department) {

        department.value =
            "";

    }


    if (gender) {

        gender.value =
            "";

    }


    if (grade) {

        grade.value =
            "";

    }

}


// ============================================================
// DEPARTMENT FILTER
// ============================================================

function populateDepartmentFilter() {

    const select =
        document.getElementById(
            "departmentFilter"
        );

    if (!select) {
        return;
    }


    const departments =
        [
            ...new Set(

                allStudents

                    .map(
                        student =>
                            String(
                                student.department ||
                                ""
                            ).trim()
                    )

                    .filter(Boolean)

            )
        ]
        .sort(
            (a, b) =>
                a.localeCompare(b)
        );


    select.innerHTML = `

        <option value="">
            All Departments
        </option>

    `;


    departments.forEach(
        function (department) {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                department;

            option.textContent =
                department;

            select.appendChild(
                option
            );

        }
    );

}


// ============================================================
// APPLY FILTERS
// ============================================================

function applyFilters() {

    const searchElement =
        document.getElementById(
            "studentSearch"
        );

    const departmentElement =
        document.getElementById(
            "departmentFilter"
        );

    const genderElement =
        document.getElementById(
            "genderFilter"
        );

    const gradeElement =
        document.getElementById(
            "gradeFilter"
        );


    const search =
        String(
            searchElement?.value ||
            ""
        )
        .trim()
        .toLowerCase();


    const department =
        String(
            departmentElement?.value ||
            ""
        )
        .trim()
        .toLowerCase();


    const gender =
        String(
            genderElement?.value ||
            ""
        )
        .trim()
        .toLowerCase();


    const grade =
        String(
            gradeElement?.value ||
            ""
        )
        .trim()
        .toLowerCase();


    filteredStudents =
        allStudents.filter(
            function (student) {

                const name =
                    String(
                        student.fullName ||
                        ""
                    )
                    .toLowerCase();


                const rrn =
                    String(
                        student.rrnNo ||
                        ""
                    )
                    .toLowerCase();


                const studentDepartment =
                    String(
                        student.department ||
                        ""
                    )
                    .toLowerCase();


                const studentGender =
                    normalizeGender(
                        student.gender
                    );


                const studentGrade =
                    String(
                        student.grade ||
                        ""
                    )
                    .toLowerCase();


                const matchesSearch =
                    !search ||
                    name.includes(search) ||
                    rrn.includes(search);


                const matchesDepartment =
                    !department ||
                    studentDepartment ===
                        department;


                const matchesGender =
                    !gender ||
                    studentGender ===
                        normalizeGender(
                            gender
                        );


                const matchesGrade =
                    !grade ||
                    studentGrade ===
                        grade;


                return (
                    matchesSearch &&
                    matchesDepartment &&
                    matchesGender &&
                    matchesGrade
                );

            }
        );


    renderStudentTable();

}


// ============================================================
// UPDATE DASHBOARD STATISTICS
// ============================================================

function updateDashboardStatistics() {

    const students =
        allStudents;


    // --------------------------------------------------------
    // TOTAL
    // --------------------------------------------------------

    const total =
        students.length;


    // --------------------------------------------------------
    // GENDER
    // --------------------------------------------------------

    const male =
        students.filter(
            student =>
                normalizeGender(
                    student.gender
                ) === "male"
        ).length;


    const female =
        students.filter(
            student =>
                normalizeGender(
                    student.gender
                ) === "female"
        ).length;


    // --------------------------------------------------------
    // EXAM ELIGIBILITY
    // --------------------------------------------------------

    const eligible =
        students.filter(
            student =>
                normalizeEligibility(
                    student.eligibleForExam
                ) === "eligible"
        ).length;


    const notEligible =
        students.filter(
            student =>
                normalizeEligibility(
                    student.eligibleForExam
                ) === "not eligible"
        ).length;


    // --------------------------------------------------------
    // GRADE
    // --------------------------------------------------------

    const passing =
        students.filter(
            student =>
                String(
                    student.grade || ""
                )
                .trim()
                .toLowerCase() === "p"
        ).length;


    const failing =
        students.filter(
            student =>
                String(
                    student.grade || ""
                )
                .trim()
                .toLowerCase() === "f"
        ).length;


    // --------------------------------------------------------
    // CGPA
    // --------------------------------------------------------

    const cgpas =
        students

            .map(
                student =>
                    Number(
                        student.cgpa
                    )
            )

            .filter(
                value =>
                    Number.isFinite(value)
            );


    const averageCGPA =
        calculateAverage(
            cgpas
        );


    const highestCGPA =
        cgpas.length
            ? Math.max(...cgpas)
            : "-";


    const lowestCGPA =
        cgpas.length
            ? Math.min(...cgpas)
            : "-";


    const highCGPA =
        students.filter(
            student =>
                Number(student.cgpa) >= 8
        ).length;


    const lowCGPA =
        students.filter(
            student =>
                Number(student.cgpa) < 6
        ).length;


    // --------------------------------------------------------
    // ATTENDANCE
    // --------------------------------------------------------

    const attendanceValues =
        students
            .map(
                calculateAttendance
            )
            .filter(
                value =>
                    value !== null
            );


    const averageAttendance =
        calculateAverage(
            attendanceValues
        );


    const above75 =
        attendanceValues.filter(
            value =>
                value >= 75
        ).length;


    const below75 =
        attendanceValues.filter(
            value =>
                value < 75
        ).length;


    // --------------------------------------------------------
    // UPDATE HTML
    // --------------------------------------------------------

    setText(
        "totalStudents",
        total
    );

    setText(
        "maleStudents",
        male
    );

    setText(
        "femaleStudents",
        female
    );

    setText(
        "averageCGPA",
        averageCGPA === "-"
            ? "-"
            : averageCGPA
    );

    setText(
        "eligibleStudents",
        eligible
    );

    setText(
        "notEligibleStudents",
        notEligible
    );

    setText(
        "passingStudents",
        passing
    );

    setText(
        "failingStudents",
        failing
    );

    setText(
        "averageAttendance",
        averageAttendance === "-"
            ? "-"
            : `${averageAttendance}%`
    );

    setText(
        "above75",
        above75
    );

    setText(
        "below75",
        below75
    );

    setText(
        "highestCGPA",
        highestCGPA
    );

    setText(
        "lowestCGPA",
        lowestCGPA
    );

    setText(
        "highCGPAStudents",
        highCGPA
    );

    setText(
        "lowCGPAStudents",
        lowCGPA
    );

    setText(
        "eligibleBox",
        eligible
    );

    setText(
        "notEligibleBox",
        notEligible
    );


    console.log(
        "Faculty statistics:",
        {
            total,
            male,
            female,
            eligible,
            notEligible,
            passing,
            failing,
            averageCGPA,
            averageAttendance
        }
    );

}


// ============================================================
// RENDER STUDENT TABLE
// ============================================================

function renderStudentTable() {

    const tableBody =
        document.getElementById(
            "studentTableBody"
        );


    if (!tableBody) {

        console.error(
            "studentTableBody not found."
        );

        return;
    }


    // --------------------------------------------------------
    // COUNT ELEMENT
    // --------------------------------------------------------

    const countElement =
        document.getElementById(
            "studentCount"
        ) ||
        document.getElementById(
            "studentListCount"
        );


    if (countElement) {

        countElement.textContent =
            `${filteredStudents.length} student${
                filteredStudents.length === 1
                    ? ""
                    : "s"
            }`;

    }


    // --------------------------------------------------------
    // NO DATA
    // --------------------------------------------------------

    if (
        filteredStudents.length === 0
    ) {

        renderEmptyTable(
            "No students match the selected filters."
        );

        return;
    }


    // --------------------------------------------------------
    // TABLE ROWS
    // --------------------------------------------------------

    tableBody.innerHTML =
        filteredStudents
            .map(
                function (
                    student,
                    index
                ) {

                    const attendance =
                        calculateAttendance(
                            student
                        );


                    const grade =
                        String(
                            student.grade ||
                            "-"
                        )
                        .trim();


                    const eligibility =
                        String(
                            student.eligibleForExam ||
                            "-"
                        )
                        .trim();


                    const gradeClass =
                        grade
                            .toLowerCase() === "p"
                            ? "pass"
                            : "fail";


                    const eligibilityClass =
                        normalizeEligibility(
                            eligibility
                        ) === "eligible"
                            ? "eligible"
                            : "not-eligible";


                    return `

                        <tr>

                            <td>
                                ${index + 1}
                            </td>

                            <td>

                                <strong>
                                    ${escapeHTML(
                                        student.fullName ||
                                        "-"
                                    )}
                                </strong>

                            </td>

                            <td>
                                ${escapeHTML(
                                    student.rrnNo ||
                                    "-"
                                )}
                            </td>

                            <td>
                                ${escapeHTML(
                                    student.department ||
                                    "-"
                                )}
                            </td>

                            <td>
                                ${formatGender(
                                    student.gender
                                )}
                            </td>

                            <td>
                                ${student.cgpa ?? "-"}
                            </td>

                            <td>

                                <span
                                    class="status ${gradeClass}"
                                >
                                    ${escapeHTML(
                                        grade
                                    )}
                                </span>

                            </td>

                            <td>

                                ${
                                    attendance === null
                                        ? "-"
                                        : `${attendance}%`
                                }

                            </td>

                            <td>

                                <span
                                    class="status ${eligibilityClass}"
                                >
                                    ${escapeHTML(
                                        eligibility
                                    )}
                                </span>

                            </td>

                        </tr>

                    `;

                }
            )
            .join("");

}


// ============================================================
// EMPTY TABLE
// ============================================================

function renderEmptyTable(
    message
) {

    const tableBody =
        document.getElementById(
            "studentTableBody"
        );

    if (!tableBody) {
        return;
    }


    tableBody.innerHTML = `

        <tr>

            <td
                colspan="9"
                class="empty-cell"
            >

                ${escapeHTML(
                    message
                )}

            </td>

        </tr>

    `;

}


// ============================================================
// ATTENDANCE
// ============================================================

function calculateAttendance(
    student
) {

    const present =
        Number(
            student.present
        );


    const absent =
        Number(
            student.absent
        );


    if (
        !Number.isFinite(present) ||
        !Number.isFinite(absent)
    ) {

        return null;
    }


    const total =
        present + absent;


    if (
        total <= 0
    ) {

        return null;
    }


    return Number(
        (
            present /
            total *
            100
        ).toFixed(2)
    );

}


// ============================================================
// GENDER NORMALIZATION
// ============================================================

function normalizeGender(
    gender
) {

    const value =
        String(
            gender || ""
        )
        .trim()
        .toLowerCase();


    if (
        value === "female" ||
        value === "f"
    ) {

        return "female";
    }


    if (
        value === "male" ||
        value === "m"
    ) {

        return "male";
    }


    return value;
}


function formatGender(
    gender
) {

    const normalized =
        normalizeGender(
            gender
        );


    if (
        normalized === "female"
    ) {

        return "Female";
    }


    if (
        normalized === "male"
    ) {

        return "Male";
    }


    return escapeHTML(
        gender || "-"
    );

}


// ============================================================
// ELIGIBILITY NORMALIZATION
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
// AVERAGE
// ============================================================

function calculateAverage(
    values
) {

    if (
        !Array.isArray(values) ||
        values.length === 0
    ) {

        return "-";
    }


    const valid =
        values.filter(
            value =>
                Number.isFinite(
                    Number(value)
                )
        );


    if (!valid.length) {
        return "-";
    }


    const total =
        valid.reduce(
            (
                sum,
                value
            ) =>
                sum + Number(value),
            0
        );


    return (
        total /
        valid.length
    ).toFixed(2);

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
            value ??
            "-";
    }

}


// ============================================================
// SHOW MESSAGE
// ============================================================

function showMessage(
    message,
    type = ""
) {

    let element =
        document.getElementById(
            "facultyMessage"
        );


    if (!element) {

        element =
            document.getElementById(
                "searchMessage"
            );
    }


    if (!element) {
        return;
    }


    element.textContent =
        message;


    element.style.display =
        "block";


    if (type) {

        element.className =
            `message ${type}`;

    }

}


// ============================================================
// HIDE MESSAGE
// ============================================================

function hideMessage() {

    const element =
        document.getElementById(
            "facultyMessage"
        ) ||
        document.getElementById(
            "searchMessage"
        );


    if (element) {

        element.style.display =
            "none";
    }

}


// ============================================================
// CALCULATE STATISTICS FOR FILTERED DATA
// ============================================================

function getFilteredStatistics() {

    const students =
        filteredStudents;


    const cgpas =
        students
            .map(
                student =>
                    Number(student.cgpa)
            )
            .filter(
                value =>
                    Number.isFinite(value)
            );


    const attendance =
        students
            .map(
                calculateAttendance
            )
            .filter(
                value =>
                    value !== null
            );


    return {

        total:
            students.length,

        male:
            students.filter(
                student =>
                    normalizeGender(
                        student.gender
                    ) === "male"
            ).length,

        female:
            students.filter(
                student =>
                    normalizeGender(
                        student.gender
                    ) === "female"
            ).length,

        averageCGPA:
            calculateAverage(
                cgpas
            ),

        averageAttendance:
            calculateAverage(
                attendance
            )
    };

}


// ============================================================
// EXPORT EXCEL
// ============================================================

async function downloadExcel() {

    if (
        !filteredStudents.length
    ) {

        alert(
            "There are no students to export."
        );

        return;
    }


    const button =
        document.getElementById(
            "downloadExcelBtn"
        );


    try {

        if (button) {

            button.disabled =
                true;

            button.textContent =
                "Generating...";
        }


        const response =
            await facultyFetch(
                `${FACULTY_API_URL}/api/reports/excel`,
                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            title:
                                "Faculty Student Report",

                            students:
                                filteredStudents
                        })
                }
            );


        if (!response.ok) {

            const errorText =
                await response.text();

            console.error(
                "Excel error:",
                errorText
            );

            throw new Error(
                `Excel API returned HTTP ${response.status}`
            );
        }


        const blob =
            await response.blob();


        const url =
            window.URL.createObjectURL(
                blob
            );


        const link =
            document.createElement(
                "a"
            );


        link.href =
            url;


        link.download =
            "faculty-student-report.xlsx";


        document.body.appendChild(
            link
        );


        link.click();


        link.remove();


        window.URL.revokeObjectURL(
            url
        );


        alert(
            "Excel report downloaded successfully."
        );

    }

    catch (error) {

        console.error(
            "Excel export error:",
            error
        );


        alert(
            `Unable to generate Excel report.\n${error.message}`
        );

    }

    finally {

        if (button) {

            button.disabled =
                false;

            button.textContent =
                "📊 Export Excel";
        }

    }

}


// ============================================================
// LOGOUT
// ============================================================

function logoutFaculty() {

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
// ESCAPE HTML
// ============================================================

function escapeHTML(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";
    }


    return String(value)

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
// NAVIGATION
// ============================================================

function toggleMenu(
    menuId
) {

    const menu =
        document.getElementById(
            menuId
        );


    if (menu) {

        menu.classList.toggle(
            "show"
        );

    }

}


// ============================================================
// FINAL MESSAGE
// ============================================================

console.log(
    "Faculty dashboard.js loaded successfully."
);