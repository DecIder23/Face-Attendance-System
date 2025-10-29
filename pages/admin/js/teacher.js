// Teacher management module
export default function initializeTeacherModule({ closeModal, fetchInitialData, API_BASE_URL, authenticatedFetch }) {

    async function fetchTeachersInternal() {
        try {
            const teachersResponse = await authenticatedFetch(`${API_BASE_URL}/teachers`);
            if (teachersResponse && teachersResponse.ok) {
                const teachers = await teachersResponse.json();
                localStorage.setItem('teachers', JSON.stringify(teachers));
                updateTeachersTable(teachers);
            } else {
                console.error('Failed to fetch teachers:', teachersResponse ? teachersResponse.statusText : 'Network error');
            }
        } catch (error) {
            console.error('Error fetching teachers:', error);
        }
    }
    const teacherForm = document.getElementById('teacherForm');
    const teacherModal = document.getElementById('teacherModal');
    const addTeacherBtn = document.getElementById('addTeacherBtn');
    const manageTeacherBtn = document.getElementById('manageTeacherBtn');

    // Open modal
    addTeacherBtn.addEventListener('click', () => teacherModal.style.display = 'block');
    const closeButton = teacherModal.querySelector('.close-button');
    closeButton.addEventListener('click', () => closeModal(teacherModal));
    // Close modal on outside click
    window.addEventListener('click', (e) => {
        if (e.target === teacherModal) closeModal(teacherModal);
    });

    // Teacher form submission
    teacherForm.addEventListener('submit', async (e) => {
        e.preventDefault();
    // ...collect form values...
    const editId = teacherForm.getAttribute('data-edit-id');
    const prevData = editId ? JSON.parse(teacherForm.getAttribute('data-prev') || '{}') : {};
    function keepOrNew(val, prev) { return val && val.trim() !== '' ? val : (prev || ''); }
    const firstName = keepOrNew(document.getElementById('teacherFirstName').value, prevData.firstName);
    const lastName = keepOrNew(document.getElementById('teacherLastName').value, prevData.lastName);
    const fatherName = keepOrNew(document.getElementById('fatherName').value, prevData.fatherName);
    const password = keepOrNew(document.getElementById('teacherPassword').value, prevData.password);
    const cnic = keepOrNew(document.getElementById('teacherCNIC').value, prevData.cnic);
    const email = keepOrNew(document.getElementById('teacherEmail').value, prevData.email);
    const phone = keepOrNew(document.getElementById('teacherPhone').value, prevData.phone);
    const dob = keepOrNew(document.getElementById('teacherDOB').value, prevData.dob);
    const gender = keepOrNew(document.getElementById('teacherGender').value, prevData.gender);
    const department = keepOrNew(document.getElementById('teacherDepartment').value, prevData.department);
    const address = keepOrNew(document.getElementById('teacherAddress').value, prevData.address);
    const emergencyContact = keepOrNew(document.getElementById('emergencyContact').value, prevData.emergencyContact);
    const photoInput = document.getElementById('teacherPhotos');
    const photos = [];
        if (photoInput.files.length > 0) {
            for (let i = 0; i < Math.min(photoInput.files.length, 3); i++) {
                const file = photoInput.files[i];
                const reader = new FileReader();
                reader.onload = async function(e) {
                    photos.push(e.target.result);
                    if (photos.length === Math.min(photoInput.files.length, 3)) {
                        await submitTeacherData(photos);
                    }
                };
                reader.readAsDataURL(file);
            }
        } else {
            await submitTeacherData([]);
        }
        async function submitTeacherData(teacherPhotos) {
            const teacherData = {
                firstName, lastName, fatherName, password, cnic, email, phone, dob, gender, department, address, emergencyContact, photos: teacherPhotos
            };
            let response;
            try {
                if (editId) {
                    // Update existing teacher
                    response = await authenticatedFetch(`${API_BASE_URL}/teachers/${editId}`, {
                        method: 'PUT',
                        body: JSON.stringify(teacherData)
                    });
                } else {
                    // Add new teacher
                    response = await authenticatedFetch(`${API_BASE_URL}/teachers`, {
                        method: 'POST',
                        body: JSON.stringify(teacherData)
                    });
                }
                if (response && response.ok) {
                    closeModal(teacherModal);
                    teacherForm.reset();
                    teacherForm.removeAttribute('data-edit-id');
                    document.getElementById('teacherFormSubmitBtn').textContent = 'Add Teacher';
                    document.getElementById('photoPreview').innerHTML = '';
                    await fetchInitialData(); // Refresh all data after add/update
                } else {
                    alert(editId ? 'Failed to update teacher.' : 'Failed to add teacher.');
                }
            } catch (error) {
                alert(editId ? 'Error updating teacher.' : 'Error adding teacher.');
            }
        }
    });
    // Reset form and button when modal is closed
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            teacherForm.reset();
            teacherForm.removeAttribute('data-edit-id');
            document.getElementById('teacherFormSubmitBtn').textContent = 'Add Teacher';
            document.getElementById('photoPreview').innerHTML = '';
        });
    }

    // Manage/search teachers
    manageTeacherBtn.addEventListener('click', () => {
        const searchTerm = prompt('Enter teacher name to search:');
        if (searchTerm) filterTeachers(searchTerm);
    });
    function filterTeachers(searchTerm) {
        const teachers = JSON.parse(localStorage.getItem('teachers')) || [];
        const filtered = teachers.filter(teacher =>
            (`${teacher.firstName} ${teacher.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (teacher.department && teacher.department.toLowerCase().includes(searchTerm.toLowerCase())))
        );
        updateTeachersTable(filtered);
    }
    function updateTeachersTable(filteredData) {
        const teachers = filteredData || JSON.parse(localStorage.getItem('teachers')) || [];
        const tbody = document.querySelector('#teachersTable tbody');
        if (!tbody) return;
        tbody.innerHTML = '';
        teachers.forEach(teacher => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${teacher.id}</td>
                <td>${teacher.firstName} ${teacher.lastName}</td>
                <td>${teacher.department}</td>
                <td>${teacher.email}</td>
                <td>${teacher.phone}</td>
                <td>
                    <button class="edit-btn edit-teacher-btn" data-id="${teacher.id}"><i class="fas fa-edit"></i></button>
                    <button class="delete-btn delete-teacher-btn" data-id="${teacher.id}"><i class="fas fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(row);
        });
        // Delete functionality
        tbody.querySelectorAll('.delete-teacher-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const teacherId = e.currentTarget.dataset.id;
                if (confirm('Are you sure you want to delete this teacher?')) {
                    try {
                        const response = await authenticatedFetch(`${API_BASE_URL}/teachers/${teacherId}`, { method: 'DELETE' });
                        if (response && response.ok) {
                            await fetchInitialData(); // Refresh all data after deleting teacher
                        } else {
                            alert('Failed to delete teacher.');
                        }
                    } catch (error) {
                        alert('Error deleting teacher.');
                    }
                }
            });
        });
        // Edit functionality
        tbody.querySelectorAll('.edit-teacher-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const teacherId = e.currentTarget.dataset.id;
                const teachers = JSON.parse(localStorage.getItem('teachers')) || [];
                const teacher = teachers.find(t => t.id == teacherId);
                if (teacher) {
                    document.getElementById('teacherFirstName').value = teacher.firstName || '';
                    document.getElementById('teacherLastName').value = teacher.lastName || '';
                    document.getElementById('fatherName').value = teacher.fatherName || '';
                    document.getElementById('teacherPassword').value = teacher.password || '';
                    document.getElementById('teacherCNIC').value = teacher.cnic || '';
                    document.getElementById('teacherEmail').value = teacher.email || '';
                    document.getElementById('teacherPhone').value = teacher.phone || '';
                    // Format date for input type="date"
                    let dobValue = teacher.dob || '';
                    if (dobValue && dobValue.length > 10) dobValue = dobValue.slice(0, 10);
                    document.getElementById('teacherDOB').value = dobValue;
                    document.getElementById('teacherGender').value = teacher.gender || '';
                    document.getElementById('teacherDepartment').value = teacher.department || '';
                    document.getElementById('teacherAddress').value = teacher.address || '';
                    document.getElementById('emergencyContact').value = teacher.emergencyContact || '';
                    teacherModal.style.display = 'block';
                    teacherForm.setAttribute('data-edit-id', teacherId);
                    teacherForm.setAttribute('data-prev', JSON.stringify(teacher));
                    document.getElementById('teacherFormSubmitBtn').textContent = 'Update Teacher';
                }
            });
        });
    }

    // Initial fetch of teachers when the module is initialized
    fetchTeachersInternal();

    return {
        filterTeachers: filterTeachers,
        updateTeachersTable: updateTeachersTable,
        fetchTeachers: fetchTeachersInternal // Expose internal fetch for dashboard.js to call if needed
    };
}
