document.addEventListener('DOMContentLoaded', async function() {
    // Always get email from cookie if not in localStorage
    if (!localStorage.getItem('studentEmail')) {
        const cookieEmail = getCookie('email');
        if (cookieEmail) {
            localStorage.setItem('studentEmail', cookieEmail);
        }
    }

    let department = localStorage.getItem('studentDepartment');
    let batch = localStorage.getItem('studentBatch');
    let studentName = localStorage.getItem('studentName') || 'Student';
    let studentEmail = localStorage.getItem('studentEmail');
    let token = localStorage.getItem('token');

    // New logic: fetch all students and find by email, prompt if not found
    async function findStudentByEmail(email) {
        try {
            const res = await fetch('http://localhost:3000/api/students', {
                headers: { 'Authorization': `Bearer ${token}` },
                credentials: 'include'
            });
            if (res.ok) {
                const students = await res.json();
                return students.find(s => s.email && s.email.toLowerCase() === email.toLowerCase());
            }
        } catch (e) {}
        return null;
    }

    async function getValidStudent() {
        let email = localStorage.getItem('studentEmail');
        let student = null;
        if (!email) {
            email = prompt('Enter your student email:');
            if (!email) return null;
            email = email.trim();
        }
        console.log('Looking up student with email:', email);
        student = await findStudentByEmail(email);
        if (!student) {
            alert('Student not found. Please contact admin.');
            return null;
        }
        localStorage.setItem('studentEmail', email);
        return student;
    }

    let currentStudent = null;
    if (!department || !batch) {
        currentStudent = await getValidStudent();
        if (currentStudent) {
            department = currentStudent.department;
            batch = currentStudent.batch;
            studentName = (currentStudent.firstName + ' ' + currentStudent.lastName).trim();
            localStorage.setItem('studentDepartment', department);
            localStorage.setItem('studentBatch', batch);
            localStorage.setItem('studentName', studentName);
        } else {
            alert('Student profile not found. Please contact admin.');
            window.location.href = '/login.html';
            return;
        }
    }

    // Optionally display student name if element exists
    const studentNameElement = document.getElementById('studentName');
    if (studentNameElement) studentNameElement.textContent = studentName;

    // Debug logs
    console.log('StudentName:', studentName);
    console.log('Department:', department);
    console.log('Batch:', batch);
    // Fetch all subjects and classes
    let allSubjects = [];
    let allClasses = [];
    try {
        const [subjectsRes, classesRes] = await Promise.all([
            fetch('http://localhost:3000/api/subjects', { headers: { 'Authorization': `Bearer ${token}` }, credentials: 'include' }),
            fetch('http://localhost:3000/api/classes', { headers: { 'Authorization': `Bearer ${token}` }, credentials: 'include' })
        ]);
        if (subjectsRes.ok) allSubjects = await subjectsRes.json();
        if (classesRes.ok) allClasses = await classesRes.json();
    } catch (e) {}
    console.log('All Subjects:', allSubjects);
    console.log('All Classes:', allClasses);
    // Attach department and batch to each subject from its class and log for debug
    allSubjects.forEach(subject => {
        const classObj = allClasses.find(cls => String(cls.id) === String(subject.classId));
        subject.department = classObj && classObj.department ? classObj.department : 'N/A';
        subject.batch = classObj && classObj.batch ? classObj.batch : 'N/A';
        subject.creditHours = subject.creditHours || 3;
    });
    // Only show subjects that match both department and batch (case-insensitive, type-agnostic)
    function normalize(val) {
        return (val || '').toString().trim().toLowerCase();
    }
    let filteredSubjects = allSubjects.filter(subj =>
        normalize(subj.department) === normalize(department) &&
        normalize(subj.batch) === normalize(batch)
    );
    // Fallback: if no subjects match both, show all subjects for the department
    let usedFallback = false;
    if (filteredSubjects.length === 0 && department) {
        filteredSubjects = allSubjects.filter(subj =>
            normalize(subj.department) === normalize(department)
        );
        usedFallback = true;
    }
    console.log('Filtered Subjects:', filteredSubjects);

    // Fetch lecture schedule for the student and extract unique subjects
    let lectureSubjects = [];
    try {
        // Fetch current student profile (reuse logic from lecture-schedule.js)
        const studentProfile = currentStudent || await getValidStudent();
        if (studentProfile) {
            const API_BASE_URL = 'http://localhost:3000/api';
            const programIdentifier = `${studentProfile.department.trim()} ${studentProfile.batch.trim()}`;
            const url = `${API_BASE_URL}/lectureSchedules?program=${encodeURIComponent(programIdentifier)}`;
            const schedules = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` }, credentials: 'include' }).then(r => r.json());
            // Extract unique subject names from the schedule
            lectureSubjects = [...new Set(schedules.map(s => s.subjectName))];
        }
    } catch (e) { console.error('Error fetching lecture schedule:', e); }
    // Filter allSubjects to only those present in the lecture schedule
    filteredSubjects = allSubjects.filter(subj => lectureSubjects.includes(subj.name));
    // Fallback: if no match, show all subjects
    if (filteredSubjects.length === 0) filteredSubjects = allSubjects;

    // Update stats and grid
    updateSemesterStats(filteredSubjects);
    renderSubjectsGrid(filteredSubjects, department, batch, false);
});

// Clear cached student info on logout
function clearStudentCacheOnLogout() {
    localStorage.removeItem('studentDepartment');
    localStorage.removeItem('studentBatch');
    localStorage.removeItem('studentName');
    localStorage.removeItem('studentEmail');
}

// Attach to logout button if it exists
const logoutBtn = document.querySelector('.logout a');
if (logoutBtn) {
    logoutBtn.addEventListener('click', clearStudentCacheOnLogout);
}

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

function updateSemesterStats(subjects) {
    document.getElementById('totalSubjects').textContent = subjects.length;
    document.getElementById('creditHours').textContent = subjects.reduce((total, subject) => total + (subject.creditHours || 0), 0);
}


function renderSubjectsGrid(subjects, department, batch, usedFallback) {
    const subjectsGrid = document.getElementById('subjectsGrid');
    subjectsGrid.innerHTML = '';
    if (!subjects.length) {
        subjectsGrid.innerHTML = `
            <div style="border:2px solid #e74c3c;padding:16px;margin-bottom:16px;background:#fff3f3;color:#c0392b;">
                <strong>No subjects found for your department and batch.</strong><br>
                <strong>Your Department:</strong> ${department || 'N/A'} <br>
                <strong>Your Batch:</strong> ${batch || 'N/A'} <br>
                <em>If you think this is a mistake, please contact your administrator.</em>
            </div>
        `;
        return;
    }
    if (usedFallback) {
        subjectsGrid.innerHTML += `
            <div style="border:2px solid #f39c12;padding:12px;margin-bottom:12px;background:#fffbe6;color:#b9770e;">
                <strong>Note:</strong> No subjects matched your batch. Showing all subjects for your department instead.<br>
                <strong>Your Department:</strong> ${department || 'N/A'} <br>
                <strong>Your Batch:</strong> ${batch || 'N/A'} <br>
            </div>
        `;
    }
    // Display exactly like teacher subject cards
    const cardsHTML = subjects.map(subject => `
        <div class="subject-card">
            <div class="subject-header">
                <h3>${subject.code || ''}</h3>
                <p>${subject.name || ''}</p>
            </div>
            <div class="subject-body">
                <ul class="subject-info">
                    <li class="info-item">
                        <i class="fas fa-user"></i>
                        <span>Teacher: ${subject.teacherName || ''}</span>
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
    subjectsGrid.innerHTML += cardsHTML;
}
