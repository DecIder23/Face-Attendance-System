// Get DOM elements
const studentNameElement = document.getElementById('studentName');
const attendanceRateElement = document.getElementById('attendanceRate');
const totalSubjectsElement = document.getElementById('totalSubjects');
const todayClassesElement = document.getElementById('todayClasses');
const attendanceTableElement = document.getElementById('attendanceTable');

// Add logout functionality
document.querySelector('.logout a').addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userRole');
    window.location.href = '../../index.html';
});

// --- Fetch lecture schedule subjects for the student ---
async function fetchLectureScheduleSubjects() {
    let department = localStorage.getItem('studentDepartment');
    let batch = localStorage.getItem('studentBatch');
    let token = localStorage.getItem('token');
    if (!department || !batch) return [];
    const programIdentifier = `${department.trim()} ${batch.trim()}`;
    const url = `http://localhost:3000/api/lectureSchedules?program=${encodeURIComponent(programIdentifier)}`;
    try {
        const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` }, credentials: 'include' });
        if (!res.ok) return [];
        const schedules = await res.json();
        return schedules;
    } catch (e) { return []; }
}

// --- Fetch and update dashboard data dynamically ---
async function updateDashboard() {
    try {
        // Student info
        const studentName = localStorage.getItem('userEmail') || 'Student';
        studentNameElement.textContent = studentName;

        // Fetch lecture schedule
        const schedules = await fetchLectureScheduleSubjects();
    // Unique subjects (count each subject only once, even if multiple periods)
    const uniqueSubjects = [...new Set(schedules.map(s => (s.subjectName || '').trim()))];
    totalSubjectsElement.textContent = uniqueSubjects.length;

    // Today's classes: count unique subjects for today only (avoid duplicates)
    const today = new Date();
    const todayDay = today.toLocaleDateString('en-US', { weekday: 'long' });
    const todaysClasses = schedules.filter(s => (s.day || '').toLowerCase() === todayDay.toLowerCase());
    const uniqueTodaySubjects = [...new Set(todaysClasses.map(s => (s.subjectName || '').trim()))];
    todayClassesElement.textContent = uniqueTodaySubjects.length;

        // Optionally, fetch and show recent attendance (if available)
        // This can be improved to fetch from attendance API if needed
        attendanceTableElement.innerHTML = '';
        // ...existing code for attendance table (if you want to show recent attendance)
    } catch (error) {
        console.error('Error updating dashboard:', error);
    }
}

// Format date to a more readable format
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    updateDashboard();
});
