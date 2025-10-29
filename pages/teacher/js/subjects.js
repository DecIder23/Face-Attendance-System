// DOM Elements
const teacherNameElement = document.getElementById('teacherName');
const totalSubjectsElement = document.getElementById('totalSubjects');
const totalStudentsElement = document.getElementById('totalStudents');
const totalCreditHoursElement = document.getElementById('totalCreditHours');
const subjectsGridElement = document.getElementById('subjectsGrid');

// Fetch teacher profile from backend (reuse logic from profile.js)
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

// Initialize the page
async function initializePage() {
    // Get teacher profile
    const teacher = await fetchTeacherProfile();
    if (!teacher) return;
    const teacherFullName = `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim();
    teacherNameElement.textContent = teacherFullName;

    // Fetch all subjects, students, and classes
    const allSubjects = await fetchSubjects();
    const allStudents = await fetchStudents();
    const allClasses = await fetchClasses();
    // Filter subjects by teacher name
    const teacherSubjects = allSubjects.filter(subj =>
        (subj.teacherName && subj.teacherName.trim().toLowerCase() === teacherFullName.trim().toLowerCase())
    );

    // For each subject, count all students and attach department/batch from class
    teacherSubjects.forEach(subject => {
        subject.students = allStudents.length;
        const classObj = allClasses.find(cls => String(cls.id) === String(subject.classId));
        subject.department = classObj && classObj.department ? classObj.department : 'N/A';
        subject.batch = classObj && classObj.batch ? classObj.batch : 'N/A';
    });

    // Update statistics
    totalSubjectsElement.textContent = teacherSubjects.length;
    totalStudentsElement.textContent = teacherSubjects.reduce((sum, subj) => sum + (subj.students || 0), 0);
    totalCreditHoursElement.textContent = teacherSubjects.length * 3;

    // Create subject cards (remove section, set credit hours to 3)
    const cardsHTML = teacherSubjects.map(subject => `
        <div class="subject-card">
            <div class="subject-header">
                <h3>${subject.code || ''}</h3>
                <p>${subject.name || ''}</p>
            </div>
            <div class="subject-body">
                <ul class="subject-info">
                    <li class="info-item">
                        <i class="fas fa-user-graduate"></i>
                        <span>Students: ${subject.students || 0}</span>
                    </li>
                    <li class="info-item">
                        <i class="fas fa-building"></i>
                        <span>Department: ${subject.department || 'N/A'}</span>
                    </li>
                    <li class="info-item">
                        <i class="fas fa-layer-group"></i>
                        <span>Batch: ${subject.batch || 'N/A'}</span>
                    </li>
                    <li class="info-item">
                        <i class="fas fa-clock"></i>
                        <span>Credit Hours: 3</span>
                    </li>
                    
                </ul>
            </div>
        </div>
    `).join('');
    subjectsGridElement.innerHTML = cardsHTML;
}

document.addEventListener('DOMContentLoaded', initializePage);
