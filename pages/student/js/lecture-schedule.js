// DOM Elements
const studentNameElement = document.getElementById('studentName');
const currentDateRangeElement = document.getElementById('currentDateRange');
const scheduleGridElement = document.getElementById('scheduleGrid');
const prevWeekBtn = document.getElementById('prevWeek');
const nextWeekBtn = document.getElementById('nextWeek');

// ---------- Backend Integration ----------
const API_BASE_URL = 'http://localhost:3000/api';
let studentSchedules = [];

// Authenticated fetch helper
async function authenticatedFetch(url, options = {}) {
    const token = localStorage.getItem('token');
    options.headers = { ...(options.headers || {}), 'Authorization': `Bearer ${token}` };
    const res = await fetch(url, options);
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || res.statusText);
    }
    return await res.json();
}

// Load schedules relevant to current student
async function loadStudentSchedule(studentProfile) {
    if (!studentProfile || !studentProfile.department || !studentProfile.batch) {
        console.error('Student profile is incomplete:', studentProfile);
        return;
    }
    console.log('Student Profile for Schedule:', studentProfile);

    console.log('Requesting schedules for department:', studentProfile.department, 'and batch:', studentProfile.batch);

    try {
        // Combine department and batch to create the program identifier for filtering.
        const programIdentifier = `${studentProfile.department.trim()} ${studentProfile.batch.trim()}`;
        const url = `${API_BASE_URL}/lectureSchedules?program=${encodeURIComponent(programIdentifier)}`;

        console.log(`Fetching schedules with URL: ${url}`);
        studentSchedules = await authenticatedFetch(url);

        console.log('Received filtered schedules from backend:', studentSchedules);
        if (studentSchedules.length === 0) {
            console.warn('No matching schedules found for the student\'s program. The backend returned an empty list.');
        }

    } catch (err) {
        console.error('Error loading student schedules:', err);
        studentSchedules = [];
    }
}
// ---------- End Integration ----------







// Fetch current student's profile from the backend
async function fetchCurrentStudentProfile() {
    try {
        return await authenticatedFetch(`${API_BASE_URL}/students/me`);
    } catch (error) {
        console.error('Error fetching student profile:', error);
        // Redirect to login if unauthorized or other critical error
        if (error.message.includes('401') || error.message.includes('403')) {
            window.location.href = '/index.html';
        }
        return null;
    }
}

// Initialize the page
async function initializePage() {
    // Fetch current student profile first
    const studentProfile = await fetchCurrentStudentProfile();
    if (!studentProfile) {
        console.error('Could not load student profile.');
        return;
    }

    // Optionally show student name if there is an element
    if (studentNameElement) {
        studentNameElement.textContent = `${studentProfile.firstName || ''} ${studentProfile.lastName || ''}`.trim();
    }

    // Load schedules from backend
    await loadStudentSchedule(studentProfile);

    // Generate grid and other UI
    createScheduleGrid();
    updateDateRange();
    setupEventListeners();
}


// Update date range display
function updateDateRange() {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Start from Monday
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 4); // End on Friday

    const options = { month: 'long', day: 'numeric', year: 'numeric' };
    const startDate = startOfWeek.toLocaleDateString('en-US', options);
    // const endDate = endOfWeek.toLocaleDateString('en-US', options);
    // currentDateRangeElement.textContent = `${startDate} - ${endDate}`;
}

// Helper: map backend startTime to display slot
function mapStartTimeToDisplayTime(startTime) {
    if (!startTime) return null;
    const mapping = {
        '08:00:00': '8:00 AM',
        '09:00:00': '9:30 AM',
        '09:30:00': '9:30 AM',
        '10:45:00': '11:00 AM',
        '11:00:00': '11:00 AM',
        '01:00:00': '12:30 PM',
        '13:00:00': '12:30 PM',
        '02:00:00': '2:00 PM',
        '14:00:00': '2:00 PM',
        '14:45:00': '2:00 PM'
    };
    const parts = startTime.split(':');
    if (parts[0].length === 1) parts[0] = '0' + parts[0];
    const normalized = parts.join(':');
    return mapping[normalized] || null;
}

// Create schedule grid
function createScheduleGrid() {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const times = ['8:00 AM', '9:30 AM', '11:00 AM', '12:30 PM', '2:00 PM'];

    // Clear the grid
    scheduleGridElement.innerHTML = '';
    days.forEach(day => {
        const daySchedule = {classes: studentSchedules.filter(c => c.day === day).map(s => ({
            time: mapStartTimeToDisplayTime(s.startTime),
            subject: s.subjectName,
            type: 'lecture',
            room: s.room || '',
            teacher: s.teacherName || ''
        }))};
        const classes = daySchedule ? daySchedule.classes : [];
        const dayCol = document.createElement('div');
        dayCol.className = 'day-column';
        // Day header
        const dayHeader = document.createElement('div');
        dayHeader.className = 'day-header';
        dayHeader.textContent = day;
        dayCol.appendChild(dayHeader);
        // Time slots
        times.forEach(time => {
            const slotDiv = document.createElement('div');
            slotDiv.className = 'schedule-slot';
            const classAtTime = classes.find(c => c.time === time);
            if (classAtTime) {
                const classSlot = document.createElement('div');
                classSlot.className = 'class-slot ' + classAtTime.type;
                const h4 = document.createElement('h4');
                h4.textContent = classAtTime.subject;
                classSlot.appendChild(h4);
                const roomP = document.createElement('p');
                roomP.textContent = classAtTime.room;
                classSlot.appendChild(roomP);
                const teacherP = document.createElement('p');
                teacherP.textContent = classAtTime.teacher;
                classSlot.appendChild(teacherP);
                slotDiv.appendChild(classSlot);
            }
            dayCol.appendChild(slotDiv);
        });
        scheduleGridElement.appendChild(dayCol);
    });
}

// Set up event listeners
function setupEventListeners() {
    // Note: prev/next week buttons are not on the student page, so no listeners are needed for them.

    // Add click event listeners to class slots
    document.querySelectorAll('.class-slot').forEach(slot => {
        slot.addEventListener('click', () => {
            const subject = slot.querySelector('h4').textContent;
            const code = slot.querySelector('p').textContent;
            console.log(`Clicked on ${subject} (${code})`);
        });
    });
}

// Initial call to setup the page
document.addEventListener('DOMContentLoaded', initializePage);
