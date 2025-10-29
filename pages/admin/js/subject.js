// Subject management module
export default function initializeSubjectModule({ closeModal, fetchInitialData, API_BASE_URL, authenticatedFetch, populateTeacherSelect, populateClassSelect }) {

    async function fetchSubjectsInternal() {
        try {
            const subjectsResponse = await authenticatedFetch(`${API_BASE_URL}/subjects`);
            if (subjectsResponse && subjectsResponse.ok) {
                const subjects = await subjectsResponse.json();
                localStorage.setItem('subjects', JSON.stringify(subjects));
                updateSubjectsTable(subjects);
            } else {
                console.error('Failed to fetch subjects:', subjectsResponse ? subjectsResponse.statusText : 'Network error');
            }
        } catch (error) {
            console.error('Error fetching subjects:', error);
        }
    }
    const subjectForm = document.getElementById('subjectForm');
    const subjectModal = document.getElementById('subjectModal');
    const addSubjectBtn = document.getElementById('addSubjectBtn');
    const manageSubjectBtn = document.getElementById('manageSubjectBtn');
    const teacherSelect = document.getElementById('teacherName');
    const classSelect = document.getElementById('classSelect');

    // Function to populate dropdowns using passed functions
    function populateDropdowns() {
        populateTeacherSelect('teacherName');
        populateClassSelect('classSelect');
    }

    // Call populateDropdowns when modal is opened
    addSubjectBtn.addEventListener('click', () => {
        subjectModal.style.display = 'block';
        populateDropdowns();
    });
    const closeButton = subjectModal.querySelector('.close-button');
    closeButton.addEventListener('click', () => closeModal(subjectModal));
    // Close modal on outside click
    window.addEventListener('click', (e) => {
        if (e.target === subjectModal) closeModal(subjectModal);
    });

    // Subject form submission
    subjectForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const teacherId = document.getElementById('teacherName').value;
        const subjectName = document.getElementById('subjectName').value;
        const classId = document.getElementById('classSelect').value;
        if (!teacherId || !subjectName || !classId) {
            alert('Please fill all subject fields.');
            return;
        }
        const subjectData = { teacherId, name: subjectName, classId };
        const editId = subjectForm.getAttribute('data-edit-id');
        let response;
        try {
            if (editId) {
                // Update existing subject
                response = await authenticatedFetch(`${API_BASE_URL}/subjects/${editId}`, {
                    method: 'PUT',
                    body: JSON.stringify(subjectData)
                });
            } else {
                // Add new subject
                response = await authenticatedFetch(`${API_BASE_URL}/subjects`, {
                    method: 'POST',
                    body: JSON.stringify(subjectData)
                });
            }
            if (response && response.ok) {
                closeModal(subjectModal);
                subjectForm.reset();
                subjectForm.removeAttribute('data-edit-id');
                document.getElementById('subjectFormSubmitBtn').textContent = 'Add Subject';
                await fetchInitialData(); // Refresh all data after add/update
            } else {
                alert(editId ? 'Failed to update subject.' : 'Failed to add subject.');
            }
        } catch (error) {
            alert(editId ? 'Error updating subject.' : 'Error adding subject.');
        }
    });
    // Reset form and button when modal is closed
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            subjectForm.reset();
            subjectForm.removeAttribute('data-edit-id');
            document.getElementById('subjectFormSubmitBtn').textContent = 'Add Subject';
        });
    }

    // Manage/search subjects
    manageSubjectBtn.addEventListener('click', () => {
        const searchTerm = prompt('Enter course name or teacher name to search:');
        if (searchTerm) filterSubjects(searchTerm);
    });
    function filterSubjects(searchTerm) {
        const subjects = JSON.parse(localStorage.getItem('subjects')) || [];
        const filtered = subjects.filter(subject =>
            (subject.teacherName && subject.teacherName.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (subject.courseName && subject.courseName.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (subject.className && subject.className.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        updateSubjectsTable(filtered);
    }
    function updateSubjectsTable(filteredData) {
        const subjects = filteredData || JSON.parse(localStorage.getItem('subjects')) || [];
        const tbody = document.querySelector('#subjectsTable tbody');
        if (!tbody) return;
        tbody.innerHTML = '';
        const classes = JSON.parse(localStorage.getItem('classes')) || [];
        subjects.forEach(subject => {
            let teacherName = 'N/A';
            const teachers = JSON.parse(localStorage.getItem('teachers')) || [];
            let teacherDetails = teachers.find(teacher => String(teacher.id) === String(subject.teacherId));
            if (!teacherDetails && subject.teacherId && typeof subject.teacherId === 'string' && isNaN(Number(subject.teacherId))) {
                teacherDetails = teachers.find(teacher => (`${teacher.firstName} ${teacher.lastName}` === subject.teacherId));
            }
            if (teacherDetails) {
                teacherName = `${teacherDetails.firstName} ${teacherDetails.lastName}`;
            } else if (subject.Teacher && subject.Teacher.firstName) {
                teacherName = `${subject.Teacher.firstName} ${subject.Teacher.lastName}`;
            } else if (subject.teacherId && typeof subject.teacherId === 'string' && isNaN(Number(subject.teacherId))) {
                teacherName = subject.teacherId;
            }
            const classDetails = classes.find(cls => String(cls.id) === String(subject.classId));
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${subject.id}</td>
                <td>${teacherName}</td>
                <td>${subject.name}</td>
                <td>${classDetails ? `${classDetails.department} - ${classDetails.batch} - ${classDetails.semester}` : 'N/A'}</td>
                <td>
                    <button class="edit-btn edit-subject-btn" data-id="${subject.id}"><i class="fas fa-edit"></i></button>
                    <button class="delete-btn delete-subject-btn" data-id="${subject.id}"><i class="fas fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(row);
        });
        // Delete functionality
        tbody.querySelectorAll('.delete-subject-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const subjectId = e.currentTarget.dataset.id;
                if (confirm('Are you sure you want to delete this subject?')) {
                    try {
                        const response = await authenticatedFetch(`${API_BASE_URL}/subjects/${subjectId}`, { method: 'DELETE' });
                        if (response && response.ok) {
                            await fetchInitialData(); // Refresh all data after deleting subject
                        } else {
                            alert('Failed to delete subject.');
                        }
                    } catch (error) {
                        alert('Error deleting subject.');
                    }
                }
            });
        });
        // Edit functionality
        tbody.querySelectorAll('.edit-subject-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const subjectId = e.currentTarget.dataset.id;
                const subjects = JSON.parse(localStorage.getItem('subjects')) || [];
                const subject = subjects.find(s => s.id == subjectId);
                if (subject) {
                    document.getElementById('teacherName').value = subject.teacherId;
                    document.getElementById('subjectName').value = subject.name;
                    document.getElementById('classSelect').value = subject.classId;
                    subjectModal.style.display = 'block';
                    subjectForm.setAttribute('data-edit-id', subjectId);
                    document.getElementById('subjectFormSubmitBtn').textContent = 'Update Subject';
                    // Repopulate dropdowns in case data changed
                    if (typeof populateTeacherSelect === 'function') populateTeacherSelect('teacherName');
                    if (typeof populateClassSelect === 'function') populateClassSelect('classSelect');
                }
            });
        });
            button.addEventListener('click', async (e) => {
                const subjectId = e.currentTarget.dataset.id;
                if (confirm('Are you sure you want to delete this subject?')) {
                    try {
                        const response = await authenticatedFetch(`${API_BASE_URL}/subjects/${subjectId}`, { method: 'DELETE' });
                        if (response && response.ok) {
                            await fetchInitialData(); // Refresh all data after deleting subject
                        } else {
                            alert('Failed to delete subject.');
                        }
                    } catch (error) {
                        alert('Error deleting subject.');
                    }
                }
            });
        
    }

    // Initial fetch of subjects when the module is initialized
    fetchSubjectsInternal();

    return {
        filterSubjects: filterSubjects,
        updateSubjectsTable: updateSubjectsTable,
        fetchSubjects: fetchSubjectsInternal // Expose internal fetch for dashboard.js to call if needed
    };
}
