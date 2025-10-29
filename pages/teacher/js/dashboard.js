// Get DOM elements
const teacherNameElement = document.getElementById('teacherName');
const totalStudentsElement = document.getElementById('totalStudents');
const totalSubjectsElement = document.getElementById('totalSubjects');
const todayAttendanceElement = document.getElementById('todayAttendance');
const todayClassesElement = document.getElementById('todayClasses');
const scheduleTableElement = document.getElementById('scheduleTable');
const activityListElement = document.getElementById('activityList');







// Fetch teacher profile from backend
async function fetchTeacherProfile() {
    const token = localStorage.getItem('token');
    if (!token) return null;
    const response = await fetch('http://localhost:3000/api/teachers/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.teacher;
}

// Fetch all subjects from backend
async function fetchSubjects() {
    const token = localStorage.getItem('token');
    if (!token) return [];
    const response = await fetch('http://localhost:3000/api/subjects', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data;
}

// Fetch all students from backend
async function fetchStudents() {
    const token = localStorage.getItem('token');
    if (!token) return [];
    const response = await fetch('http://localhost:3000/api/students', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data;
}

// Fetch all classes from backend
async function fetchClasses() {
    const token = localStorage.getItem('token');
    if (!token) return [];
    const response = await fetch('http://localhost:3000/api/classes', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data;
}

// Fetch all lecture schedules from backend
async function fetchLectureSchedules() {
    const token = localStorage.getItem('token');
    if (!token) return [];
    const response = await fetch('http://localhost:3000/api/lectureSchedules', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data;
}

// Initialize dashboard
async function initializeDashboard() {
    const teacher = await fetchTeacherProfile();
    if (!teacher) return;
    const teacherFullName = `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim();
    document.querySelectorAll('#teacherName').forEach(el => {
        el.textContent = teacherFullName;
    });

    // Fetch subjects, students, and classes
    const allSubjects = await fetchSubjects();
    const allStudents = await fetchStudents();
    const allClasses = await fetchClasses();
    console.log('Subjects:', allSubjects);
    console.log('Students:', allStudents);
    console.log('Classes:', allClasses);

    // Filter subjects for this teacher
    const teacherSubjects = allSubjects.filter(subj => {
        const nameMatches = subj.teacherName && subj.teacherName.trim().toLowerCase() === teacherFullName.trim().toLowerCase();
        const idMatches = typeof subj.teacherId !== 'undefined' && typeof teacher.id !== 'undefined' && Number(subj.teacherId) === Number(teacher.id);
        return nameMatches || idMatches;
    });

    // Get the class IDs for the teacher's subjects
    const teacherClassIds = [...new Set(teacherSubjects.map(subj => String(subj.classId)))];
    // Build a quick lookup of the teacher's classes (full class objects)
    const teacherClasses = allClasses.filter(cls => teacherClassIds.includes(String(cls.id)));

    // Filter students who are in the teacher's classes
    // 1. Prefer matching via student.classId when present.
    // 2. Fallback to matching via department & batch (covers older student records without classId).
    const teacherStudents = allStudents.filter(student => {
        // Case 1: exact classId match
        if (student.classId && teacherClassIds.includes(String(student.classId))) {
            return true;
        }
        // Case 2: match by department+batch with any of the teacher's classes
        if (student.department && student.batch) {
            return teacherClasses.some(cls =>
                cls.department && cls.batch &&
                cls.department.trim().toLowerCase() === student.department.trim().toLowerCase() &&
                String(cls.batch).trim().toLowerCase() === String(student.batch).trim().toLowerCase()
            );
        }
        return false;
    });

    // Fetch lecture schedules to find today's classes
    const allSchedules = await fetchLectureSchedules();
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

    const todaySchedules = allSchedules.filter(s =>
        s.teacherName && s.teacherName.trim().toLowerCase() === teacherFullName.trim().toLowerCase() &&
        s.day.toLowerCase() === today.toLowerCase()
    );

    // Update statistics
    totalSubjectsElement.textContent = teacherSubjects.length;
    // Ensure we count each student only once across all classes/subjects
const uniqueStudentIds = new Set(teacherStudents.map(s => (typeof s.id !== 'undefined' ? s.id : s.studentId)));
totalStudentsElement.textContent = uniqueStudentIds.size;
    todayAttendanceElement.textContent = '-'; // Placeholder
    todayClassesElement.textContent = todaySchedules.length;

    // Update today's schedule table
    if (todaySchedules.length > 0) {
        scheduleTableElement.innerHTML = todaySchedules.map(s => {
            console.log(`[DEBUG] Processing schedule item:`, s);

            // Find the subject in the master list that matches the schedule's subject name and teacher
            const subjectInfo = allSubjects.find(subj =>
                subj.name && s.subjectName &&
                subj.teacherName && s.teacherName &&
                subj.name.trim().toLowerCase() === s.subjectName.trim().toLowerCase() &&
                subj.teacherName.trim().toLowerCase() === s.teacherName.trim().toLowerCase()
            );

            let studentsInSubject = 0;
            if (subjectInfo) {
            } else {
                console.log(`[DEBUG] Subject found, but it has no classId.`);
            }

            return `
                <tr>
                    <td>${s.timeSlot || ''}</td>
                    <td>${s.subjectName || ''}</td>
                    
                    <td>${s.program || 'N/A'}</td>
                </tr>
            `;
        }).join('');
    } else {
        scheduleTableElement.innerHTML = '<tr><td colspan="3">No classes scheduled for today.</td></tr>';
    }
}

document.addEventListener('DOMContentLoaded', initializeDashboard);
