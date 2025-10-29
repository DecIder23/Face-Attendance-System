// Get DOM elements
const teacherNameElement = document.getElementById('teacherName');
const subjectSelectElement = document.getElementById('subjectSelect');
const sectionSelectElement = document.getElementById('sectionSelect');
const startDateElement = document.getElementById('startDate');
const endDateElement = document.getElementById('endDate');
const applyFiltersButton = document.getElementById('applyFilters');
const exportDataButton = document.getElementById('exportData');
const totalStudentsElement = document.getElementById('totalStudents');
const presentTodayElement = document.getElementById('presentToday');
const absentTodayElement = document.getElementById('absentToday');
const averageAttendanceElement = document.getElementById('averageAttendance');
const attendanceRecordsElement = document.getElementById('attendanceRecords');
const prevPageButton = document.getElementById('prevPage');
const nextPageButton = document.getElementById('nextPage');
const currentPageElement = document.getElementById('currentPage');

// Mock data (in real application, this would come from the backend)
const teacherData = {
    name: 'Prof. Sarah Johnson',
    subjects: [
        { code: 'CS301', name: 'Database Systems' },
        { code: 'CS302', name: 'Web Development' },
        { code: 'CS303', name: 'Software Engineering' }
    ],
    sections: ['A', 'B', 'C']
};
setTeacherNameOnAllPages(teacherData);
if (teacherNameElement) {
    if (teacherData.firstName || teacherData.lastName) {
        teacherNameElement.textContent = `${teacherData.firstName || ''} ${teacherData.lastName || ''}`.trim();
    } else {
        teacherNameElement.textContent = teacherData.name || 'Teacher';
    }
}

const mockAttendanceData = [
    {
        date: '2025-04-14',
        studentId: 'ST001',
        name: 'John Doe',
        subject: 'CS301',
        section: 'A',
        status: 'present',
        time: '09:30 AM'
    },
    // Add more mock data as needed
];

// Pagination state
let currentPage = 1;
const itemsPerPage = 10;
let filteredData = [...mockAttendanceData];

// Initialize select options
function initializeSelects() {
    // Add subjects
    teacherData.subjects.forEach(subject => {
        const option = document.createElement('option');
        option.value = subject.code;
        option.textContent = `${subject.code} - ${subject.name}`;
        subjectSelectElement.appendChild(option);
    });

    // Add sections
    teacherData.sections.forEach(section => {
        const option = document.createElement('option');
        option.value = section;
        option.textContent = `Section ${section}`;
        sectionSelectElement.appendChild(option);
    });

    // Set default date range
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    startDateElement.value = thirtyDaysAgo.toISOString().split('T')[0];
    endDateElement.value = today;
}

// Update statistics
function updateStatistics() {
    const today = new Date().toISOString().split('T')[0];
    const todayRecords = filteredData.filter(record => record.date === today);
    
    totalStudentsElement.textContent = new Set(filteredData.map(record => record.studentId)).size;
    presentTodayElement.textContent = todayRecords.filter(record => record.status === 'present').length;
    absentTodayElement.textContent = todayRecords.filter(record => record.status === 'absent').length;
    
    const totalPresent = filteredData.filter(record => record.status === 'present').length;
    const averagePercentage = (totalPresent / filteredData.length * 100).toFixed(1);
    averageAttendanceElement.textContent = `${averagePercentage}%`;
}

// Update attendance table
function updateAttendanceTable() {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageData = filteredData.slice(startIndex, endIndex);

    attendanceRecordsElement.innerHTML = pageData
        .map(record => `
            <tr>
                <td>${record.date}</td>
                <td>${record.studentId}</td>
                <td>${record.name}</td>
                <td>${record.subject}</td>
                <td>${record.section}</td>
                <td>
                    <span class="status-badge status-${record.status}">
                        ${record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                    </span>
                </td>
                <td>${record.time}</td>
            </tr>
        `)
        .join('');

    // Update pagination
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    currentPageElement.textContent = `Page ${currentPage} of ${totalPages}`;
    prevPageButton.disabled = currentPage === 1;
    nextPageButton.disabled = currentPage === totalPages;
}

// Apply filters
function applyFilters() {
    const subject = subjectSelectElement.value;
    const section = sectionSelectElement.value;
    const startDate = startDateElement.value;
    const endDate = endDateElement.value;

    filteredData = mockAttendanceData.filter(record => {
        const matchesSubject = !subject || record.subject === subject;
        const matchesSection = !section || record.section === section;
        const matchesDate = (!startDate || record.date >= startDate) && 
                           (!endDate || record.date <= endDate);
        return matchesSubject && matchesSection && matchesDate;
    });

    currentPage = 1;
    updateStatistics();
    updateAttendanceTable();
}

// Export data
function exportData() {
    const headers = ['Date', 'Student ID', 'Name', 'Subject', 'Section', 'Status', 'Time'];
    const csvContent = [
        headers.join(','),
        ...filteredData.map(record => [
            record.date,
            record.studentId,
            record.name,
            record.subject,
            record.section,
            record.status,
            record.time
        ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'attendance_report.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Initialize page
function initializePage() {
    teacherNameElement.textContent = teacherData.name;
    initializeSelects();
    applyFilters();

    // Add event listeners
    applyFiltersButton.addEventListener('click', applyFilters);
    exportDataButton.addEventListener('click', exportData);
    prevPageButton.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            updateAttendanceTable();
        }
    });
    nextPageButton.addEventListener('click', () => {
        const totalPages = Math.ceil(filteredData.length / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            updateAttendanceTable();
        }
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializePage);
