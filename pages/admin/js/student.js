// Student management module
export default function initializeStudentModule({ closeModal, fetchInitialData, API_BASE_URL, authenticatedFetch }) {

    async function fetchStudentsInternal() {
        try {
            const studentsResponse = await authenticatedFetch(`${API_BASE_URL}/students`);
            if (studentsResponse && studentsResponse.ok) {
                const students = await studentsResponse.json();
                localStorage.setItem('students', JSON.stringify(students));
                updateStudentsTable(students);
            } else {
                console.error('Failed to fetch students:', studentsResponse ? studentsResponse.statusText : 'Network error');
            }
        } catch (error) {
            console.error('Error fetching students:', error);
        }
    }
    const studentForm = document.getElementById('studentForm');
    const studentModal = document.getElementById('studentModal');
    const addStudentBtn = document.getElementById('addStudentBtn');
    const manageStudentBtn = document.getElementById('manageStudentBtn');

    // Open modal
    addStudentBtn.addEventListener('click', () => studentModal.style.display = 'block');
    const closeButton = studentModal.querySelector('.close-button');
    closeButton.addEventListener('click', () => {
        closeModal(studentModal);
        studentForm.reset();
        studentForm.removeAttribute('data-edit-id');
        studentForm.removeAttribute('data-prev');
        studentModal.querySelector('h2').textContent = 'Add New Student';
        studentForm.querySelector('.btn-submit').textContent = 'Add Student';
    });
    // Close modal on outside click
    window.addEventListener('click', (e) => {
        if (e.target === studentModal) closeModal(studentModal);
    });

    // Student form submission
    studentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const editId = studentForm.getAttribute('data-edit-id');
        const prevData = editId ? JSON.parse(studentForm.getAttribute('data-prev') || '{}') : {};
        function keepOrNew(val, prev) { return val && val.trim() !== '' ? val : (prev || ''); }
        const firstName = keepOrNew(document.getElementById('studentFirstName').value, prevData.firstName);
        const lastName = keepOrNew(document.getElementById('studentLastName').value, prevData.lastName);
        const studentIdVal = keepOrNew(document.getElementById('studentId').value, prevData.studentId);
        const fatherName = keepOrNew(document.getElementById('studentFatherName').value, prevData.fatherName);
        const cnic = keepOrNew(document.getElementById('studentCNIC').value, prevData.cnic);
        const email = keepOrNew(document.getElementById('studentEmail').value, prevData.email);
        const password = keepOrNew(document.getElementById('studentPassword').value, prevData.password);
        const phone = keepOrNew(document.getElementById('studentPhone').value, prevData.phone);
        const dob = keepOrNew(document.getElementById('studentDOB').value, prevData.dateOfBirth || prevData.dob);
        const gender = keepOrNew(document.getElementById('studentGender').value, prevData.gender);
        const department = keepOrNew(document.getElementById('studentDepartment').value, prevData.department);
        const batch = keepOrNew(document.getElementById('studentBatch').value, prevData.batch);
        let semester = keepOrNew(document.getElementById('studentSemester').value, prevData.semester);
        semester = semester && semester !== '' ? parseInt(semester, 10) : null;
        const address = keepOrNew(document.getElementById('studentAddress').value, prevData.address);
        const emergencyContact = keepOrNew(document.getElementById('studentEmergencyContact').value, prevData.emergencyContact);
        const photoInput = document.getElementById('studentPhotos');
        const photos = [];
        if (photoInput.files.length > 0) {
            let loadedPhotos = 0;
            for (let i = 0; i < Math.min(photoInput.files.length, 3); i++) {
                const file = photoInput.files[i];
                const reader = new FileReader();
                reader.onload = async function(e) {
                    photos.push(e.target.result);
                    loadedPhotos++;
                    if (loadedPhotos === Math.min(photoInput.files.length, 3)) {
                        await submitStudentData(photos);
                    }
                };
                reader.readAsDataURL(file);
            }
        } else {
            await submitStudentData(editId ? prevData.photos || [] : []);
        }
        async function submitStudentData(studentPhotos) {
            const studentPayload = {
                firstName, lastName, studentId: studentIdVal, fatherName, cnic, email, password, phone, dob, gender, department, batch, semester, address, emergencyContact, photos: studentPhotos
            };
            try {
                let response;
                if (editId) {
                    response = await authenticatedFetch(`${API_BASE_URL}/students/${editId}`, {
                        method: 'PUT',
                        body: JSON.stringify(studentPayload)
                    });
                } else {
                    response = await authenticatedFetch(`${API_BASE_URL}/students`, {
                        method: 'POST',
                        body: JSON.stringify(studentPayload)
                    });
                }
                if (response && response.ok) {
                    closeModal(studentModal);
                    studentForm.reset();
                    document.getElementById('studentPhotoPreview').innerHTML = '';
                    studentForm.removeAttribute('data-edit-id');
                    studentForm.removeAttribute('data-prev');
                    studentModal.querySelector('h2').textContent = 'Add New Student';
                    studentForm.querySelector('.btn-submit').textContent = 'Add Student';
                    await fetchInitialData(); // Refresh all data after add/update
                } else {
                    alert(editId ? 'Failed to update student.' : 'Failed to add student.');
                }
            } catch (error) {
                alert(editId ? 'Error updating student.' : 'Error adding student.');
            }
        }
    });
    // (Removed duplicate closeButton declaration and event listener)

    // Manage/search students
    manageStudentBtn.addEventListener('click', () => {
        const searchTerm = prompt('Enter student name to search:');
        if (searchTerm) filterStudents(searchTerm);
    });
    function filterStudents(searchTerm) {
        const students = JSON.parse(localStorage.getItem('students')) || [];
        const filtered = students.filter(student =>
            (`${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (student.class && student.class.toLowerCase().includes(searchTerm.toLowerCase())))
        );
        updateStudentsTable(filtered);
    }
    function updateStudentsTable(filteredData) {
        const students = filteredData || JSON.parse(localStorage.getItem('students')) || [];
        const tbody = document.querySelector('#studentsTable tbody');
        if (!tbody) return;
        tbody.innerHTML = '';
        students.forEach(student => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${student.id}</td>
                <td>${student.firstName} ${student.lastName}</td>
                <td>${student.department} - Batch ${student.batch}</td>
                <td>${student.email}</td>
                <td>${student.phone}</td>
                <td>
                    <button class="edit-btn edit-student-btn" data-id="${student.id}"><i class="fas fa-edit"></i></button>
                    <button class="delete-btn delete-student-btn" data-id="${student.id}"><i class="fas fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(row);
        });
        tbody.querySelectorAll('.delete-student-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const studentId = e.currentTarget.dataset.id;
                if (confirm('Are you sure you want to delete this student?')) {
                    try {
                        const response = await authenticatedFetch(`${API_BASE_URL}/students/${studentId}`, { method: 'DELETE' });
                        if (response && response.ok) {
                            await fetchInitialData(); // Refresh all data after deleting student
                        } else {
                            alert('Failed to delete student.');
                        }
                    } catch (error) {
                        alert('Error deleting student.');
                    }
                }
            });
        });
        // Edit functionality
        tbody.querySelectorAll('.edit-student-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const studentId = e.currentTarget.dataset.id;
                const students = JSON.parse(localStorage.getItem('students')) || [];
                const student = students.find(s => s.id == studentId);
                if (student) {
                    // Fill form fields with student data
                    document.getElementById('studentFirstName').value = student.firstName || '';
                    document.getElementById('studentLastName').value = student.lastName || '';
                    document.getElementById('studentId').value = student.studentId || '';
                    document.getElementById('studentFatherName').value = student.fatherName || '';
                    document.getElementById('studentCNIC').value = student.cnic || '';
                    document.getElementById('studentEmail').value = student.email || '';
                    document.getElementById('studentPassword').value = student.password || '';
                    document.getElementById('studentPhone').value = student.phone || '';
                    document.getElementById('studentDOB').value = student.dateOfBirth || '';
                    document.getElementById('studentGender').value = student.gender || '';
                    document.getElementById('studentDepartment').value = student.department || '';
                    document.getElementById('studentBatch').value = student.batch || '';
                    document.getElementById('studentSemester').value = student.semester || '';
                    document.getElementById('studentAddress').value = student.address || '';
                    document.getElementById('studentEmergencyContact').value = student.emergencyContact || '';
                    // Clear photo preview and file input
                    document.getElementById('studentPhotoPreview').innerHTML = '';
                    document.getElementById('studentPhotos').value = '';
                    // Set edit mode
                    studentForm.setAttribute('data-edit-id', studentId);
                    studentForm.setAttribute('data-prev', JSON.stringify(student));
                    // Change modal title and button
                    studentModal.querySelector('h2').textContent = 'Edit Student';
                    studentForm.querySelector('.btn-submit').textContent = 'Update Student';
                    studentModal.style.display = 'block';
                }
            });
        });
    }

    // Initial fetch of students when the module is initialized
    fetchStudentsInternal();

    return {
        filterStudents: filterStudents,
        updateStudentsTable: updateStudentsTable,
        fetchStudents: fetchStudentsInternal // Expose internal fetch for dashboard.js to call if needed
    };
}
