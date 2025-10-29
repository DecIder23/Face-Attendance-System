// Class management module
export default function initializeClassModule({ closeModal, fetchInitialData, API_BASE_URL, authenticatedFetch }) {

    async function fetchClassesInternal() {
        try {
            const classesResponse = await authenticatedFetch(`${API_BASE_URL}/classes`);
            if (classesResponse && classesResponse.ok) {
                const classes = await classesResponse.json();
                localStorage.setItem('classes', JSON.stringify(classes));
                updateClassesTable(classes);
            } else {
                console.error('Failed to fetch classes:', classesResponse ? classesResponse.statusText : 'Network error');
            }
        } catch (error) {
            console.error('Error fetching classes:', error);
        }
    }
    const classFormElement = document.getElementById('classForm');
    const classModal = document.getElementById('classModal');
    const addClassBtn = document.getElementById('addClassBtn');
    const manageClassBtn = document.getElementById('manageClassBtn');

    // Open modal
    if (addClassBtn && classModal) {
        addClassBtn.addEventListener('click', () => classModal.style.display = 'block');
        const closeButton = classModal.querySelector('.close-button');
        if (closeButton) {
            closeButton.addEventListener('click', () => closeModal(classModal));
        }
        // Close modal on outside click
        window.addEventListener('click', (e) => {
            if (e.target === classModal) closeModal(classModal);
        });
    }

    // Class form submission
    if (classFormElement) {
        classFormElement.addEventListener('submit', async (e) => {
            e.preventDefault();
            const editId = classFormElement.getAttribute('data-edit-id');
            const prevData = editId ? JSON.parse(classFormElement.getAttribute('data-prev') || '{}') : {};
            function keepOrNew(val, prev) { return val && val.trim() !== '' ? val : (prev || ''); }
            const department = keepOrNew(document.getElementById('classDepartment').value, prevData.department);
            const batch = keepOrNew(document.getElementById('classBatch').value, prevData.batch);
            const semester = keepOrNew(document.getElementById('classSemester').value, prevData.semester);
            const classData = { department, batch, semester };
            let response;
            try {
                if (editId) {
                    // Update existing class
                    response = await authenticatedFetch(`${API_BASE_URL}/classes/${editId}`, {
                        method: 'PUT',
                        body: JSON.stringify(classData)
                    });
                } else {
                    // Add new class
                    response = await authenticatedFetch(`${API_BASE_URL}/classes`, {
                        method: 'POST',
                        body: JSON.stringify(classData)
                    });
                }
                if (response && response.ok) {
                    closeModal(classModal);
                    classFormElement.reset();
                    classFormElement.removeAttribute('data-edit-id');
                    classFormElement.removeAttribute('data-prev');
                    document.getElementById('classFormSubmitBtn').textContent = 'Add Class';
                    await fetchInitialData(); // Refresh all data after add/update
                } else {
                    alert(editId ? 'Failed to update class.' : 'Failed to add class.');
                }
            } catch (error) {
                alert(editId ? 'Error updating class.' : 'Error adding class.');
            }
        });
        // Reset form and button when modal is closed
        const closeButton = classModal.querySelector('.close-button');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                classFormElement.reset();
                classFormElement.removeAttribute('data-edit-id');
                document.getElementById('classFormSubmitBtn').textContent = 'Add Class';
            });
        }
    }

    // Manage/search classes
    if (manageClassBtn) {
        manageClassBtn.addEventListener('click', () => {
        const searchTerm = prompt('Enter program name or semester to search:');
        if (searchTerm) filterClasses(searchTerm);
    });
    }
    function filterClasses(searchTerm) {
        const classes = JSON.parse(localStorage.getItem('classes')) || [];
        const filtered = classes.filter(cls =>
            (cls.programName && cls.programName.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (cls.semester && cls.semester.toString().includes(searchTerm)) ||
            (cls.courseName && cls.courseName.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        updateClassesTable(filtered);
    }
    function updateClassesTable(filteredData) {
        const classes = filteredData || JSON.parse(localStorage.getItem('classes')) || [];
        const tbody = document.querySelector('#classesTable tbody');
        if (!tbody) return;
        tbody.innerHTML = '';
        classes.forEach(cls => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${cls.id}</td>
                <td>${cls.department}</td>
                <td>${cls.batch}</td>
                <td>${cls.semester}</td>
                <td>
                    <button class="edit-btn edit-class-btn" data-id="${cls.id}"><i class="fas fa-edit"></i></button>
                    <button class="delete-btn delete-class-btn" data-id="${cls.id}"><i class="fas fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(row);
        });
        if (tbody) {
            tbody.querySelectorAll('.delete-class-btn').forEach(button => {
                button.addEventListener('click', async (e) => {
                    const classId = e.currentTarget.dataset.id;
                    if (confirm('Are you sure you want to delete this class?')) {
                        try {
                            const response = await authenticatedFetch(`${API_BASE_URL}/classes/${classId}`, { method: 'DELETE' });
                            if (response && response.ok) {
                                await fetchInitialData(); // Refresh all data after deleting class
                            } else {
                                alert('Failed to delete class.');
                            }
                        } catch (error) {
                            alert('Error deleting class.');
                        }
                    }
                });
            });
            // Edit functionality
            tbody.querySelectorAll('.edit-class-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    const classId = e.currentTarget.dataset.id;
                    const classes = JSON.parse(localStorage.getItem('classes')) || [];
                    const cls = classes.find(c => c.id == classId);
                    if (cls) {
                        document.getElementById('classDepartment').value = cls.department || '';
                        document.getElementById('classBatch').value = cls.batch || '';
                        document.getElementById('classSemester').value = cls.semester || '';
                        classModal.style.display = 'block';
                        classFormElement.setAttribute('data-edit-id', classId);
                        classFormElement.setAttribute('data-prev', JSON.stringify(cls));
                        document.getElementById('classFormSubmitBtn').textContent = 'Update Class';
                    }
                });
            });
        }
    }

    // Initial fetch of classes when the module is initialized
    fetchClassesInternal();

    return {
        filterClasses: filterClasses,
        updateClassesTable: updateClassesTable,
        fetchClasses: fetchClassesInternal // Expose internal fetch for dashboard.js to call if needed
    };
}
