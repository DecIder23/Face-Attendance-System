// --- CONFIG ---
const API_BASE_URL = 'http://localhost:3000/api'; // Change if backend runs elsewhere

// --- Utility: Get studentId from localStorage or session (adjust as needed) ---
function getStudentId() {
    // Example: store studentId in localStorage after login
    return localStorage.getItem('studentId');
}

// --- Fetch attendance data from backend ---
async function fetchStudentAttendance(studentId) {
    const response = await fetch(`${API_BASE_URL}/attendance/student/${studentId}`);
    if (!response.ok) throw new Error('Failed to fetch attendance');
    return await response.json();
}

// --- Fetch lecture schedule subjects for the student ---
async function fetchLectureScheduleSubjects() {
    // Try to get student profile info from localStorage or backend
    let department = localStorage.getItem('studentDepartment');
    let batch = localStorage.getItem('studentBatch');
    let token = localStorage.getItem('token');
    if (!department || !batch) return [];
    const programIdentifier = `${department.trim()} ${batch.trim()}`;
    const url = `${API_BASE_URL}/lectureSchedules?program=${encodeURIComponent(programIdentifier)}`;
    try {
        const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` }, credentials: 'include' });
        if (!res.ok) return [];
        const schedules = await res.json();
        // Extract unique subject names from the schedule
        return [...new Set(schedules.map(s => s.subjectName))];
    } catch (e) { return []; }
}

// --- Calculate per-subject percentages ---
function calculateSubjectPercentages(records) {
    const subjectStats = {};
    records.forEach(r => {
        const subj = r.subject;
        if (!subjectStats[subj]) subjectStats[subj] = { present: 0, total: 0 };
        subjectStats[subj].total++;
        if (r.status.toLowerCase() === 'present') subjectStats[subj].present++;
    });
    return Object.entries(subjectStats).map(([subject, { present, total }]) => ({
        subject,
        percent: total ? Math.round((present / total) * 100) : 0,
        present,
        total
    }));
}

// --- Render per-subject percentages ---
function renderSubjectPercentages(stats) {
    const container = document.getElementById('subjectPercentages');
    if (!container) return;
    container.innerHTML = stats.map(s =>
        `<div class="subject-percentage"><strong>${s.subject}:</strong> ${s.percent}% (${s.present}/${s.total})</div>`
    ).join('');
}

// Get DOM elements
const studentNameElement = document.getElementById('studentName');
const overallAttendanceElement = document.getElementById('overallAttendance');
const presentDaysElement = document.getElementById('presentDays');
const absentDaysElement = document.getElementById('absentDays');
const subjectFilterElement = document.getElementById('subjectFilter');
const monthFilterElement = document.getElementById('monthFilter');
const attendanceTableElement = document.getElementById('attendanceTable');

// --- Main page initialization (replace mock data with backend) ---
async function initializePage() {
    try {
        const studentId = getStudentId();
        if (!studentId) throw new Error('Student not logged in');
        // Fetch real data from backend
        const data = await fetchStudentAttendance(studentId);
        // Fetch subjects from lecture schedule
        const lectureSubjects = await fetchLectureScheduleSubjects();
        // Filter attendance records to only those subjects present in the lecture schedule
        let filteredRecords = data.attendanceRecords.filter(r => lectureSubjects.includes(r.subject));
        if (filteredRecords.length === 0) filteredRecords = data.attendanceRecords;
        studentNameElement && (studentNameElement.textContent = data.name || '');
        // Calculate overall stats
        const total = filteredRecords.length;
        const present = filteredRecords.filter(r => r.status.toLowerCase() === 'present').length;
        const absent = total - present;
        overallAttendanceElement.textContent = total ? Math.round((present / total) * 100) + '%' : '0%';
        presentDaysElement.textContent = present;
        absentDaysElement.textContent = absent;

        // Render subject cards
        renderSubjectsGrid([...new Set(filteredRecords.map(r => r.subject))]);

        // Hide attendance table initially
        document.getElementById('attendanceTableContainer').style.display = 'none';

        // Logout
        document.querySelector('.logout a').addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('userRole');
            window.location.href = '../../index.html';
        });
    } catch (error) {
        console.error('Error initializing page:', error);
    }
}

// Render subject cards grid
function renderSubjectsGrid(subjects) {
    const grid = document.getElementById('subjectsGrid');
    grid.innerHTML = '';
    if (!subjects.length) {
        grid.innerHTML = '<div style="padding:16px;">No subjects found in your lecture schedule.</div>';
        return;
    }
    grid.innerHTML = subjects.map(subject => `
        <div class="subject-card clickable" data-subject="${subject}">
            <div class="subject-header">
                <h3>${subject}</h3>
            </div>
        </div>
    `).join('');
    // Add click listeners
    document.querySelectorAll('.subject-card.clickable').forEach(card => {
        card.addEventListener('click', () => showAttendanceForSubject(card.dataset.subject));
    });
}

// Show attendance table for selected subject
function showAttendanceForSubject(subject) {
    const studentId = getStudentId();
    fetchStudentAttendance(studentId).then(data => {
        fetchLectureScheduleSubjects().then(lectureSubjects => {
            let filteredRecords = data.attendanceRecords.filter(r => lectureSubjects.includes(r.subject));
            if (filteredRecords.length === 0) filteredRecords = data.attendanceRecords;
            const subjectRecords = filteredRecords.filter(r => r.subject === subject);
            // Update table title
            document.getElementById('attendanceTableTitle').textContent = `Attendance Record for ${subject}`;
            // Show table
            document.getElementById('attendanceTableContainer').style.display = '';
            // Render table
            attendanceTableElement.innerHTML = subjectRecords.map(record => `
                <tr>
                    <td>${formatDate(record.date)}</td>
                    <td class="status-${record.status.toLowerCase()}">${record.status}</td>
                    <td>${record.time}</td>
                    <td>${record.markedBy}</td>
                </tr>
            `).join('');
        });
    });
}

// Filter attendance records (now returns filtered array if returnArray=true)
function filterAttendanceRecords(records, returnArray = false) {
    const subject = subjectFilterElement.value;
    const month = monthFilterElement.value;
    let filteredRecords = [...records];
    if (subject !== 'all') {
        filteredRecords = filteredRecords.filter(
            record => record.subject.toLowerCase() === subject
        );
    }
    if (month !== 'all') {
        filteredRecords = filteredRecords.filter(record => {
            const recordMonth = new Date(record.date)
                .toLocaleString('default', { month: 'long' })
                .toLowerCase();
            return recordMonth === month;
        });
    }
    if (returnArray) return filteredRecords;
    updateAttendanceTable(filteredRecords);
}

// Format date (reuse)
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializePage);
