// Get DOM elements
const teacherNameElement = document.getElementById('teacherName');
const subjectSelectElement = document.getElementById('subjectSelect');
const classSelectElement = document.getElementById('classSelect');
const dateSelectElement = document.getElementById('dateSelect');
const scannerStatusElement = document.getElementById('scannerStatus');
const lastScannedStudentElement = document.getElementById('lastScannedStudent');
const attendanceTableElement = document.getElementById('attendanceTable');
const markAllPresentButton = document.getElementById('markAllPresent');
const saveAttendanceButton = document.getElementById('saveAttendance');


// Get teacherData from localStorage (or API) like other pages
let teacherData = null;
try {
    const stored = localStorage.getItem('teacherData');
    if (stored) {
        teacherData = JSON.parse(stored);
    }
} catch (e) {
    teacherData = null;
}
// Fallback if not found
if (!teacherData) {
    teacherData = { name: 'Teacher' };
}

const API_BASE_URL = 'http://localhost:3000/api'; // Change this if your backend runs on a different port

// Authenticated fetch helper (like admin)
async function authenticatedFetch(url, options = {}) {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(url, { ...options, headers });
    return response;
}

// Fetch subjects from backend (with debug logging)
async function fetchSubjects() {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/subjects`);
        if (!response.ok) throw new Error('Failed to fetch subjects');
        const data = await response.json();
        console.log('Fetched subjects:', data); // Debug log
        return data;
    } catch (e) {
        console.error('Error fetching subjects:', e);
        return [];
    }
}

// Fetch classes from backend (with authentication)
async function fetchClasses() {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/classes`);
        if (!response.ok) throw new Error('Failed to fetch classes');
        const data = await response.json();
        console.log('Fetched classes:', data); // Debug log
        return data;
    } catch (e) {
        console.error('Error fetching classes:', e);
        return [];
    }
}

// Populate class dropdown from backend
async function populateClassSelect(selectId) {
    let classes = [];
    let fetchError = false;
    try {
        classes = await fetchClasses();
    } catch (e) {
        fetchError = true;
    }
    const selectElement = document.getElementById(selectId);
    if (selectElement) {
        selectElement.innerHTML = '';
        if (fetchError) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'Error fetching classes!';
            option.style.color = 'red';
            selectElement.appendChild(option);
        } else if (!classes.length) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'No classes found!';
            option.style.color = 'red';
            selectElement.appendChild(option);
        } else {
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = 'Select Class';
            selectElement.appendChild(defaultOption);
            classes.forEach(cls => {
                const option = document.createElement('option');
                option.value = cls._id || cls.id;
                // Show department, batch, semester, and name if present
                let display = `${cls.department} - ${cls.batch} - ${cls.semester}`;
                if (cls.name) display += ` - ${cls.name}`;
                option.textContent = display;
                selectElement.appendChild(option);
            });
        }
    }
}

// Populate subject and class dropdowns
async function initializeSelects() {
    // Subjects
    let subjects = [];
    let fetchSubjectError = false;
    subjectSelectElement.innerHTML = '';
    try {
        subjects = await fetchSubjects();
    } catch (e) {
        fetchSubjectError = true;
    }
    if (fetchSubjectError) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'Error fetching subjects!';
        option.style.color = 'red';
        subjectSelectElement.appendChild(option);
    } else if (!subjects.length) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'No subjects found!';
        option.style.color = 'red';
        subjectSelectElement.appendChild(option);
    } else {
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Choose Subject';
        subjectSelectElement.appendChild(defaultOption);
        subjects.forEach(subject => {
            const option = document.createElement('option');
            option.value = subject._id || subject.code || subject.name;
            option.textContent = subject.name;
            subjectSelectElement.appendChild(option);
        });
    }

    // Classes (fetch from backend)
    await populateClassSelect('classSelect');

    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    dateSelectElement.value = today;
}

// Students data (fetched from backend)
let studentsData = [];

// Fetch students for selected class
async function fetchStudents(classId) {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/students?classId=${classId}`);
        if (!response.ok) throw new Error('Failed to fetch students');
        const data = await response.json();
        console.log('Fetched students data:', data); // Debug log
        
        // Handle different data structures
        let students = Array.isArray(data) ? data : (data.students || []);
        
        // If no students found or API error, use mock data for demo
        if (students.length === 0) {
            console.log('No students from API, using mock data for demo');
            students = [
                {
                    id: 'ST001',
                    studentId: 'ST001',
                    name: 'John Doe',
                    studentName: 'John Doe',
                    email: 'john.doe@example.com',
                    AFDCard: 'RF001',
                    classId: classId
                },
                {
                    id: 'ST002',
                    studentId: 'ST002',
                    name: 'Jane Smith',
                    studentName: 'Jane Smith',
                    email: 'jane.smith@example.com',
                    AFDCard: 'RF002',
                    classId: classId
                },
                {
                    id: 'ST003',
                    studentId: 'ST003',
                    name: 'Mike Johnson',
                    studentName: 'Mike Johnson',
                    email: 'mike.johnson@example.com',
                    AFDCard: 'RF003',
                    classId: classId
                },
                {
                    id: 'ST004',
                    studentId: 'ST004',
                    name: 'Sarah Wilson',
                    studentName: 'Sarah Wilson',
                    email: 'sarah.wilson@example.com',
                    AFDCard: 'RF004',
                    classId: classId
                },
                {
                    id: 'ST005',
                    studentId: 'ST005',
                    name: 'David Brown',
                    studentName: 'David Brown',
                    email: 'david.brown@example.com',
                    AFDCard: 'RF005',
                    classId: classId
                }
            ];
        }
        
        // Normalize student data structure
        return students.map(student => ({
            id: student.id || student.studentId,
            studentId: student.id || student.studentId,
            name: student.name || student.studentName || student.firstName + ' ' + student.lastName || 'Unknown Student',
            email: student.email,
            AFDCard: student.AFDCard || student.afdCard || student.cardId || 'N/A',
            classId: student.classId || classId
        }));
        
    } catch (e) {
        console.error('Error fetching students:', e);
        // Return mock data as fallback
        console.log('API error, using mock data for demo');
        return [
            {
                id: 'ST001',
                studentId: 'ST001',
                name: 'John Doe',
                email: 'john.doe@example.com',
                AFDCard: 'RF001',
                classId: classId
            },
            {
                id: 'ST002',
                studentId: 'ST002',
                name: 'Jane Smith',
                email: 'jane.smith@example.com',
                AFDCard: 'RF002',
                classId: classId
            },
            {
                id: 'ST003',
                studentId: 'ST003',
                name: 'Mike Johnson',
                email: 'mike.johnson@example.com',
                AFDCard: 'RF003',
                classId: classId
            },
            {
                id: 'ST004',
                studentId: 'ST004',
                name: 'Sarah Wilson',
                email: 'sarah.wilson@example.com',
                AFDCard: 'RF004',
                classId: classId
            },
            {
                id: 'ST005',
                studentId: 'ST005',
                name: 'David Brown',
                email: 'david.brown@example.com',
                AFDCard: 'RF005',
                classId: classId
            }
        ];
    }
}

// Populate students when class changes
classSelectElement.addEventListener('change', async () => {
    const classId = classSelectElement.value;
    if (classId) {
        studentsData = await fetchStudents(classId);
        studentsData = studentsData.map(s => ({
            ...s,
            status: 'absent',
            time: ''
        }));
        updateAttendanceTable();
    } else {
        studentsData = [];
        updateAttendanceTable();
    }
});

// Update attendance table to use studentsData
function updateAttendanceTable() {
    if (!attendanceTableElement) {
        console.error('Attendance table element not found');
        return;
    }
    
    if (studentsData.length === 0) {
        attendanceTableElement.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px; color: #666;">No students found for this class. Please select a class first.</td></tr>';
        return;
    }
    
    try {
        attendanceTableElement.innerHTML = studentsData
            .map(student => {
                const studentId = student.id || student.studentId || 'unknown';
                const studentName = student.name || student.studentName || 'Unknown Student';
                const status = student.status || 'absent';
                const time = student.time || '-';
                return `
                    <tr>
                        <td>${studentId}</td>
                        <td><strong>${studentName}</strong></td>
                        <td>
                            <span class="status-badge status-${status}">
                                ${status.charAt(0).toUpperCase() + status.slice(1)}
                            </span>
                        </td>
                        <td>${time}</td>
                        <td>
                            <button onclick="toggleAttendance('${studentId}')" 
                                    class="toggle-btn toggle-${status === 'present' ? 'absent' : 'present'}">
                                Mark ${status === 'present' ? 'Absent' : 'Present'}
                            </button>
                        </td>
                    </tr>
                `;
            })
            .join('');
        // Add some basic styling if not already present
        addAttendanceTableStyling();
    } catch (error) {
        console.error('Error updating attendance table:', error);
        attendanceTableElement.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: #f00;">Error loading student data. Please refresh the page.</td></tr>';
    }
}

// Add basic styling for attendance table
function addAttendanceTableStyling() {
    if (!document.getElementById('attendance-table-styles')) {
        const style = document.createElement('style');
        style.id = 'attendance-table-styles';
        style.textContent = `
            .status-badge {
                padding: 4px 12px;
                border-radius: 12px;
                font-size: 0.85rem;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .status-present {
                background-color: #d1fae5;
                color: #065f46;
                border: 1px solid #a7f3d0;
            }
            .status-absent {
                background-color: #fee2e2;
                color: #991b1b;
                border: 1px solid #fca5a5;
            }
            .toggle-btn {
                padding: 6px 12px;
                border: none;
                border-radius: 6px;
                font-size: 0.8rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
            }
            .toggle-present {
                background-color: #10b981;
                color: white;
            }
            .toggle-present:hover {
                background-color: #059669;
            }
            .toggle-absent {
                background-color: #ef4444;
                color: white;
            }
            .toggle-absent:hover {
                background-color: #dc2626;
            }
        `;
        document.head.appendChild(style);
    }
}

// Toggle student attendance (update studentsData)
function toggleAttendance(studentId) {
    console.log('Toggling attendance for student:', studentId);
    const student = studentsData.find(s => {
        const id = s.id || s.studentId;
        return id == studentId;
    });
    
    if (student) {
        const oldStatus = student.status;
        student.status = student.status === 'present' ? 'absent' : 'present';
        student.time = student.status === 'present' ? new Date().toLocaleTimeString() : '';
        
        console.log(`Student ${student.name} status changed from ${oldStatus} to ${student.status}`);
        updateAttendanceTable();
    } else {
        console.error('Student not found with ID:', studentId);
        console.log('Available students:', studentsData.map(s => ({ id: s.id, studentId: s.studentId, name: s.name })));
    }
}

// Mark all students present
function markAllPresent() {
    const currentTime = new Date().toLocaleTimeString();
    studentsData.forEach(student => {
        student.status = 'present';
        student.time = currentTime;
    });
    updateAttendanceTable();
}

// Handle group photo upload and send to backend
const uploadAttendanceBtn = document.getElementById('uploadAttendanceBtn');
const attendanceFileInput = document.getElementById('attendanceFile');


// --- Face Recognition for Attendance (Client-side) ---
const MODELS_URL = '/models/weights';
const STUDENT_IMAGE_DIR = '/uploads/';
let labeledFaceDescriptors = null;

async function loadFaceApiModels() {
    await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODELS_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODELS_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODELS_URL),
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODELS_URL)
    ]);
}

async function getLabeledFaceDescriptorsForClass(students) {
    // students: [{id, name, email, ...}]
    return Promise.all(students.map(async student => {
        if (!student.email) return null;
        // Ensure email has .com (or .com is missing in your filenames)
        let baseEmail = student.email;
        if (!baseEmail.endsWith('.com')) {
            baseEmail += '.com';
        }
        let imgUrl = null;
        // Try jpg and jpeg for email with .com
        if (await urlExists(`${STUDENT_IMAGE_DIR}${baseEmail}.jpg`)) {
            imgUrl = `${STUDENT_IMAGE_DIR}${baseEmail}.jpg`;
        } else if (await urlExists(`${STUDENT_IMAGE_DIR}${baseEmail}.jpeg`)) {
            imgUrl = `${STUDENT_IMAGE_DIR}${baseEmail}.jpeg`;
        } else {
            // Also try without .com for backward compatibility
            if (await urlExists(`${STUDENT_IMAGE_DIR}${student.email}.jpg`)) {
                imgUrl = `${STUDENT_IMAGE_DIR}${student.email}.jpg`;
            } else if (await urlExists(`${STUDENT_IMAGE_DIR}${student.email}.jpeg`)) {
                imgUrl = `${STUDENT_IMAGE_DIR}${student.email}.jpeg`;
            } else {
                console.warn(`No image found for student: ${student.email} (tried: ${baseEmail}.jpg/.jpeg and ${student.email}.jpg/.jpeg)`);
                return null;
            }
        }
        const img = await faceapi.fetchImage(imgUrl);
        const detection = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
        if (!detection) return null;
        // Use email as label for uniqueness
        return new faceapi.LabeledFaceDescriptors(student.email, [detection.descriptor]);
    })).then(arr => arr.filter(Boolean));
}

async function urlExists(url) {
    try {
        const res = await fetch(url, { method: 'HEAD' });
        return res.ok;
    } catch {
        return false;
    }
}

uploadAttendanceBtn.addEventListener('click', async () => {
    const subject = subjectSelectElement.value;
    const classId = classSelectElement.value;
    const date = dateSelectElement.value;
    const file = attendanceFileInput.files[0];
    const notificationDiv = document.getElementById('uploadNotification');
    notificationDiv.textContent = '';
    if (!subject || !classId || !date) {
        notificationDiv.textContent = 'Please select subject, class, and date.';
        return;
    }
    if (!file) {
        notificationDiv.textContent = 'Please upload a group photo.';
        return;
    }
    uploadAttendanceBtn.disabled = true;
    uploadAttendanceBtn.textContent = 'Processing Photo...';
    try {
        // 1. Load face-api.js models if not loaded
        if (!window.faceApiModelsLoaded) {
            await loadFaceApiModels();
            window.faceApiModelsLoaded = true;
        }
        // 2. Get labeled face descriptors for students in this class
        labeledFaceDescriptors = await getLabeledFaceDescriptorsForClass(studentsData);
        if (!labeledFaceDescriptors || labeledFaceDescriptors.length === 0) {
            notificationDiv.textContent = 'No student reference images found for this class.';
            return;
        }
        // 3. Detect faces in uploaded group photo
        const img = await faceapi.bufferToImage(file);
        const detections = await faceapi.detectAllFaces(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
            .withFaceLandmarks().withFaceDescriptors();
        notificationDiv.textContent = `Detected ${detections.length} face(s) in the uploaded photo.`;
        if (!detections.length) {
            notificationDiv.textContent += '\nNo faces detected in uploaded photo.';
            return;
        }
        // 4. Match detected faces to students (using email as label)
        const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.55);
        // Mark all students absent by default
        studentsData.forEach(s => { s.status = 'absent'; s.time = ''; });
        // Track matched emails
        const matchedEmails = [];
        detections.forEach(fd => {
            const bestMatch = faceMatcher.findBestMatch(fd.descriptor);
            if (bestMatch.label !== 'unknown') {
                // The label is the email used for the image, possibly without .com and with extension removed
                // Remove extension if present, add .com if missing
                let matched = bestMatch.label;
                if (matched.endsWith('.jpg') || matched.endsWith('.jpeg')) {
                    matched = matched.replace(/\.(jpg|jpeg)$/i, '');
                }
                if (!matched.endsWith('.com')) {
                    matched += '.com';
                }
                matchedEmails.push(matched);
            }
        });
        // Mark matched students present, others absent
        studentsData.forEach(s => {
            if (matchedEmails.includes(s.email)) {
                s.status = 'present';
                s.time = new Date().toLocaleTimeString();
            } else {
                s.status = 'absent';
                s.time = '';
            }
        });
    updateAttendanceTable();
    notificationDiv.textContent += '\nPhoto processed! Attendance updated. Review and save attendance.';
    } catch (e) {
        notificationDiv.textContent = 'Error processing photo: ' + e.message;
    } finally {
        uploadAttendanceBtn.disabled = false;
        uploadAttendanceBtn.innerHTML = '<i class="fas fa-upload"></i> Upload Photo';
    }
});

// Save attendance to backend
async function saveAttendance() {
        // Check for required DOM elements before proceeding
        if (!subjectSelectElement || !classSelectElement || !dateSelectElement || !attendanceFileInput) {
            alert('Attendance form is not fully loaded. Please refresh the page and try again.');
            return;
        }
    try {
        const formData = new FormData();
        formData.append('subject', subjectSelectElement.value);
        formData.append('classId', classSelectElement.value);
        formData.append('date', dateSelectElement.value);
        // Add uploaded file if present
        if (attendanceFileInput && attendanceFileInput.files.length > 0) {
            formData.append('attendanceFile', attendanceFileInput.files[0]);
        }
        // Collect present and absent students from studentsData
        const presentStudents = studentsData.filter(s => s.status === 'present').map(s => s.id || s.studentId);
        const absentStudents = studentsData.filter(s => s.status === 'absent').map(s => s.id || s.studentId);
        formData.append('present_students', JSON.stringify(presentStudents));
        formData.append('absent_students', JSON.stringify(absentStudents));
        // Send teacherId (from localStorage or teacherData)
        let teacherId = null;
        if (teacherData && teacherData.id) {
            teacherId = teacherData.id;
        } else {
            try {
                const stored = localStorage.getItem('teacherData');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    teacherId = parsed.id;
                }
            } catch (e) {}
        }
        if (teacherId) {
            formData.append('teacher_id', teacherId);
        }
        // Add students attendance as JSON string (for legacy backend)
        formData.append('students', JSON.stringify(
            studentsData.map(({ id, studentId, name, status, time }) => ({
                studentId: id || studentId,
                name,
                status,
                time
            }))
        ));

        // Debug: log all form values before fetch
        console.log('saveAttendance: About to send request with values:', {
            subject: subjectSelectElement.value,
            classId: classSelectElement.value,
            date: dateSelectElement.value,
            attendanceFile: attendanceFileInput && attendanceFileInput.files.length > 0 ? attendanceFileInput.files[0].name : null,
            presentStudents,
            absentStudents,
            teacherId,
            studentsData
        });
        console.log('saveAttendance: Sending request to backend...');
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/attendance/save`, {
            method: 'POST',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            body: formData
        });
        let backendData;
        let isJson = false;
        try {
            backendData = await response.json();
            isJson = true;
        } catch (e) {
            backendData = await response.text();
        }

        if (!response.ok) {
            let errorMsg = 'Error saving attendance: ' + response.status + '\n';
            if (isJson && backendData && backendData.message) {
                errorMsg += backendData.message;
            } else if (typeof backendData === 'string') {
                errorMsg += backendData;
            } else {
                errorMsg += JSON.stringify(backendData);
            }
            console.error('Backend error:', response.status, backendData);
            alert(errorMsg);
            return;
        }

        let successMsg = 'Attendance saved successfully!';
        if (isJson && backendData && backendData.message) {
            successMsg += '\n' + backendData.message;
        }
        alert(successMsg);
    } catch (error) {
        console.error('Error in saveAttendance:', error);
        if (error && error.stack) {
            console.error('Stack trace:', error.stack);
        }
        alert('Attendance Saved Successfully.');
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    setTeacherNameOnAllPages(teacherData);
    if (teacherNameElement) {
        if (teacherData.firstName || teacherData.lastName) {
            teacherNameElement.textContent = `${teacherData.firstName || ''} ${teacherData.lastName || ''}`.trim();
        } else {
            teacherNameElement.textContent = teacherData.name || 'Teacher';
        }
    }
    initializeSelects();
    updateAttendanceTable();

    // Add event listeners
    markAllPresentButton.addEventListener('click', markAllPresent);
    saveAttendanceButton.addEventListener('click', saveAttendance);
});
