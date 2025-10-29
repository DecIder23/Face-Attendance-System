// DOM Elements
const teacherNameElement = document.getElementById('teacherName');
const currentDateRangeElement = document.getElementById('currentDateRange');
const scheduleGridElement = document.getElementById('scheduleGrid');
const prevWeekButton = document.getElementById('prevWeek');
const nextWeekButton = document.getElementById('nextWeek');

// Mock data for demonstration
const mockScheduleData = {
    teacherName: 'John Doe',
    currentWeek: {
        startDate: new Date('2024-03-01'),
        endDate: new Date('2024-03-05'),
        schedule: [
            {
                day: 'Monday',
                time: '8:00 AM',
                type: 'lecture',
                subject: 'Data Structures',
                code: 'CS-101',
                section: 'A',
                room: 'Room 101'
            },
            {
                day: 'Monday',
                time: '11:00 AM',
                type: 'lab',
                subject: 'Programming Lab',
                code: 'CS-101L',
                section: 'B',
                room: 'Lab 201'
            },
            {
                day: 'Wednesday',
                time: '2:00 PM',
                type: 'lecture',
                subject: 'Algorithms',
                code: 'CS-201',
                section: 'C',
                room: 'Room 102'
            },
            {
                day: 'Friday',
                time: '10:00 AM',
                type: 'office-hours',
                subject: 'Office Hours',
                code: 'OH',
                section: 'All',
                room: 'Office 301'
            }
        ]
    }
};

// Initialize the page
async function initializePage() {
    let teacherData = JSON.parse(localStorage.getItem('teacherData') || '{}');

    // If name is missing, fetch profile from backend
    if (!teacherData.firstName || !teacherData.lastName) {
        const profile = await fetchTeacherProfile();
        if (profile) {
            teacherData = { ...teacherData, ...profile };
            // Optionally, save the fetched profile back to localStorage
            localStorage.setItem('teacherData', JSON.stringify(teacherData));
        }
    }

    // Set teacher name in UI
    setTeacherNameOnAllPages(teacherData);
    if (teacherNameElement) {
        if (teacherData.firstName || teacherData.lastName) {
            teacherNameElement.textContent = `${teacherData.firstName || ''} ${teacherData.lastName || ''}`.trim();
        } else {
            teacherNameElement.textContent = teacherData.name || 'Teacher';
        }
    }

    // Load schedules, generate grid, and set up page
    await loadTeacherSchedule(teacherData);
    setupEventListeners();
    updateDateRangeDisplay();
}

// Generate schedule grid by populating the existing HTML structure
function generateScheduleGrid() {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    // These are the display times from the HTML
    const displayTimeSlots = ['8:00 AM', '9:30 AM', '11:00 AM', '12:30 PM', '2:00 PM'];

    // Clear any previous content
    scheduleGridElement.innerHTML = '';

    // Create the grid structure first
    days.forEach(day => {
        const dayColumn = document.createElement('div');
        dayColumn.className = 'day-column';
        dayColumn.innerHTML = `<div class="day-header">${day}</div>`;
        
        displayTimeSlots.forEach(time => {
            const scheduleSlot = document.createElement('div');
            scheduleSlot.className = 'schedule-slot';
            // Set data attributes to easily find the cell later
            scheduleSlot.dataset.day = day;
            scheduleSlot.dataset.time = time;
            dayColumn.appendChild(scheduleSlot);
        });

        scheduleGridElement.appendChild(dayColumn);
    });

    // Now, populate the grid with schedule data
    teacherSchedules.forEach(item => {
        // Map backend startTime to frontend display time
        const displayTime = mapStartTimeToDisplayTime(item.startTime);
        if (!displayTime) return; // Skip if no mapping found

        // Find the correct cell in the grid
        const cell = scheduleGridElement.querySelector(`[data-day="${item.day}"][data-time="${displayTime}"]`);
        if (cell) {
            cell.classList.add('animated-slot');
            cell.innerHTML = `
                <div class="class-slot lecture"
                     data-subject="${item.subjectName || ''}"
                     data-room="${item.room || ''}"
                     data-program="${item.program || ''}">
                    <div class="subject-name">${item.subjectName || ''}</div>
                    <div class="program-name">${item.program || ''}</div>
                    <div class="room">${item.room ? 'Room: ' + item.room : ''}</div>
                </div>
            `;
        }
    });
}

// Helper function to map backend start time to the display time in the grid
function mapStartTimeToDisplayTime(startTime) {
    if (!startTime) return null;

    // This maps the exact or approximate start time to the grid's display slots.
    const timeMappings = {
        '08:00:00': '8:00 AM',
        '09:00:00': '9:30 AM', // 9:00 AM lecture falls into the 9:30 slot
        '09:30:00': '9:30 AM',
        '10:45:00': '11:00 AM', // 10:45 AM lecture falls into the 11:00 slot
        '11:00:00': '11:00 AM',
        '01:00:00': '12:30 PM', // 1:00 PM lecture falls into the 12:30 slot
        '13:00:00': '12:30 PM',
        '02:00:00': '2:00 PM',
        '14:00:00': '2:00 PM',
        '14:45:00': '2:00 PM' // 2:45 PM lecture falls into the 2:00 slot
    };

    // Normalize inconsistent time formats (e.g., '1:00:00' vs '01:00:00')
    const parts = startTime.split(':');
    if (parts[0].length === 1) {
        parts[0] = '0' + parts[0];
        startTime = parts.join(':');
    }

    return timeMappings[startTime] || null;
}

// Update date range display
function updateDateRangeDisplay() {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 4); // Friday
    currentDateRangeElement.textContent = `${formatDate(startOfWeek)} - ${formatDate(endOfWeek)}`;
}

// Format date
function formatDate(date) {
    return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });
}

// Set up event listeners
function setupEventListeners() {
    // Week navigation buttons
    prevWeekButton.addEventListener('click', () => {
        // Add previous week logic here
        updateDateRangeDisplay();
    });

    nextWeekButton.addEventListener('click', () => {
        // Add next week logic here
        updateDateRangeDisplay();
    });

    // Schedule item click events
    document.querySelectorAll('.class-slot').forEach(item => {
        item.addEventListener('click', () => {
            const subject = item.dataset.subject;
            const code = item.dataset.code;
            const section = item.dataset.section;
            const room = item.dataset.room;
            // Add schedule item click logic here
            console.log(`Clicked: ${code} - ${subject} (${section}) in ${room}`);
        });
    });
}

/* ---------- Backend Integration ---------- */
const API_BASE_URL = 'http://localhost:3000/api';
let teacherSchedules = [];

// Authenticated fetch helper
async function authenticatedFetch(url, options = {}) {
    const token = localStorage.getItem('token');
    options.headers = { ...(options.headers || {}), 'Authorization': `Bearer ${token}` };
    const res = await fetch(url, options);
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || res.statusText);
    }
    return res.json();
}

// Load schedules for the current teacher
async function loadTeacherSchedule(teacherData) {
    try {
        const fullName = `${teacherData.firstName || ''} ${teacherData.lastName || ''}`.trim();
        if (!fullName) {
            console.error('Cannot load schedules: teacher name is missing.');
            return; // Exit if no name is available
        }

        const allSchedules = await authenticatedFetch(`${API_BASE_URL}/lectureSchedules`);
        
        if (!Array.isArray(allSchedules)) {
            console.error('Expected an array of schedules, but received:', allSchedules);
            teacherSchedules = [];
        } else {
            // Only filter by teacher name, show all slots for this teacher
            teacherSchedules = allSchedules.filter(s => 
                s.teacherName && s.teacherName.trim().toLowerCase() === fullName.toLowerCase()
            );
        }

        generateScheduleGrid();
    } catch (error) {
        console.error('Error loading teacher schedules:', error);
    }
}
/* ---------- End Integration ---------- */

// Fetch teacher profile from backend using stored auth token
async function fetchTeacherProfile() {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
        const res = await fetch(`${API_BASE_URL}/teachers/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data.teacher;
    } catch (err) {
        console.error('Error fetching teacher profile:', err);
        return null;
    }
}

// Initialize the page when DOM is loaded
document.addEventListener('DOMContentLoaded', initializePage); 