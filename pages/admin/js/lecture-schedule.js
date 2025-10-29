// Lecture schedule management module
export default function initializeLectureScheduleModule({ closeModal, fetchInitialData, API_BASE_URL, authenticatedFetch }) {
    // Fetch lecture schedules from backend and update table
    async function fetchLectureSchedulesInternal(program = '') {
        let schedules = []; // Default to an empty array
        try {
            const url = program ? `${API_BASE_URL}/lectureSchedules?program=${program}` : `${API_BASE_URL}/lectureSchedules`;
            const scheduleResponse = await authenticatedFetch(url);
            if (Array.isArray(scheduleResponse)) {
                schedules = scheduleResponse;
            } else {
                console.error('Failed to fetch lecture schedules:', scheduleResponse);
            }
        } catch (error) {
            console.error('Error fetching lecture schedules:', error);
        } finally {
            // Always update the display, even if the fetch fails, to render the grid.
            updateScheduleDisplay(schedules);
        }
    }

    const scheduleTableBody = document.querySelector('#lecture-schedule .schedule-table tbody');
    const classFilter = document.getElementById('classFilter');
    const scheduleSlotModal = document.getElementById('scheduleSlotModal');
    const scheduleSlotForm = document.getElementById('scheduleSlotForm');
    const scheduleSlotId = document.getElementById('scheduleSlotId');
    const scheduleSlotSubject = document.getElementById('scheduleSlotSubject');
    const scheduleSlotDepartment = document.getElementById('scheduleSlotDepartment');
    const scheduleSlotBatch = document.getElementById('scheduleSlotBatch');
    const scheduleSlotSection = document.getElementById('scheduleSlotSection');
    const scheduleSlotRoom = document.getElementById('scheduleSlotRoom');
    const scheduleSlotDay = document.getElementById('scheduleSlotDay');
    const scheduleSlotStartTime = document.getElementById('scheduleSlotStartTime');
    const scheduleSlotEndTime = document.getElementById('scheduleSlotEndTime');
    const scheduleSlotTeacher = document.getElementById('scheduleSlotTeacher');
    const scheduleSlotClass = document.getElementById('scheduleSlotClass');

    // Hardcoded slot IDs for each day and slot
    const slotIdMap = {
        'Monday':   ['Mo1', 'Mo2', 'Mo3', 'Mo4'],
        'Tuesday':  ['Tu1', 'Tu2', 'Tu3', 'Tu4'],
        'Wednesday':['We1', 'We2', 'We3', 'We4'],
        'Thursday': ['Th1', 'Th2', 'Th3', 'Th4'],
        'Friday':   ['Fr1', 'Fr2', 'Fr3', 'Fr4']
    };

    // Update schedule table so each slot always displays slotId, Edit, and Delete buttons, even if empty
    function updateScheduleDisplay(schedules) {
        scheduleTableBody.innerHTML = '';
        const timeSlots = [
            '9:00 - 10:30',
            '10:45 - 12:15',
            '1:00 - 2:30',
            '2:45 - 4:15'
        ];
        const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        // Map schedules by day and slotId for fast lookup
        const scheduleMap = new Map();
        schedules.forEach(schedule => {
            if (!scheduleMap.has(schedule.day)) scheduleMap.set(schedule.day, new Map());
            scheduleMap.get(schedule.day).set(schedule.slotId, schedule);
        });
        timeSlots.forEach((timeSlot, slotIdx) => {
            const row = document.createElement('tr');
            const timeCell = document.createElement('td');
            timeCell.textContent = timeSlot;
            row.appendChild(timeCell);
            daysOfWeek.forEach(day => {
                const scheduleCell = document.createElement('td');
                const slotId = slotIdMap[day][slotIdx];
                const schedule = scheduleMap.has(day) ? scheduleMap.get(day).get(slotId) : null;
                const classSlotDiv = document.createElement('div');
                classSlotDiv.classList.add('class-slot');
                classSlotDiv.dataset.day = day;
                classSlotDiv.dataset.timeSlot = timeSlot;
                classSlotDiv.dataset.slotId = slotId;
                if (schedule) {
                    classSlotDiv.classList.add('lecture');
                    classSlotDiv.dataset.scheduleId = schedule.id;
                    classSlotDiv.dataset.scheduleData = JSON.stringify(schedule);
                    const classDisplay = schedule.batch && schedule.semester
                        ? `${schedule.batch} (Sem ${schedule.semester})`
                        : schedule.program || '...';
                    classSlotDiv.innerHTML = `
                        <div class="slot-id">Slot ID: <span>${slotId}</span></div>
                        <div class="subject-name">${schedule.subjectName || ''}</div>
                        <div class="teacher-name">${schedule.teacherName || ''}</div>
                        <div class="program">${schedule.batch && schedule.semester ? `${schedule.batch} (Sem ${schedule.semester})` : schedule.program || '...'}</div>
                        <div class="room">Room: ${schedule.room ? schedule.room : ''}</div>
                        <div class="slot-actions">
                            <button class="edit-slot" data-slot-id="${slotId}"><i class="fas fa-edit"></i></button>
                            <button class="delete-slot" data-slot-id="${slotId}"><i class="fas fa-trash"></i></button>
                        </div>
                    `;
                } else {
                    classSlotDiv.classList.add('empty');
                    classSlotDiv.innerHTML = `
                        <div class="slot-id">Slot ID: <span>${slotId}</span></div>
                        <div class="subject-name"></div>
                        <div class="teacher-name"></div>
                        <div class="program"></div>
                        <div class="room"></div>
                        <div class="slot-actions">
                            <button class="edit-slot" data-slot-id="${slotId}"><i class="fas fa-edit"></i></button>
                            <button class="delete-slot" data-slot-id="${slotId}"><i class="fas fa-trash"></i></button>
                        </div>
                    `;
                }
                scheduleCell.appendChild(classSlotDiv);
                row.appendChild(scheduleCell);
            });
            scheduleTableBody.appendChild(row);
        });
    }

    // Filter by program/class
    classFilter.addEventListener('change', () => {
        const selectedProgram = classFilter.value;
        fetchLectureSchedulesInternal(selectedProgram);
    });

    // Event delegation for schedule slot clicks (edit/delete)
    scheduleTableBody.addEventListener('click', async (e) => {
        const editButton = e.target.closest('.edit-slot');
        const deleteButton = e.target.closest('.delete-slot');
        if (editButton) {
            const classSlotDiv = editButton.closest('.class-slot');
            const slotId = classSlotDiv.dataset.slotId;
            const day = classSlotDiv.dataset.day;
            const timeSlot = classSlotDiv.dataset.timeSlot;
            const scheduleData = classSlotDiv.dataset.scheduleData ? JSON.parse(classSlotDiv.dataset.scheduleData) : {};
            openScheduleSlotModal(slotId, day, timeSlot, scheduleData);
        } else if (deleteButton) {
            const classSlotDiv = deleteButton.closest('.class-slot');
            const slotId = classSlotDiv.dataset.slotId;

            // Confirm before deleting
            if (confirm(`Are you sure you want to delete the schedule for slot ${slotId}?`)) {
                try {
                    // authenticatedFetch now handles errors, so we just need to call it.
                    await authenticatedFetch(`${API_BASE_URL}/lectureSchedules/slot/${slotId}`, {
                        method: 'DELETE'
                    });

                    // If the request was successful, update the UI.
                    if (classSlotDiv) {
                        classSlotDiv.querySelector('.subject-name').textContent = '';
                        classSlotDiv.querySelector('.teacher-name').textContent = '';
                        classSlotDiv.querySelector('.program').textContent = '';
                        classSlotDiv.querySelector('.room').textContent = '';
                        classSlotDiv.removeAttribute('data-schedule-id');
                        classSlotDiv.removeAttribute('data-schedule-data');
                        classSlotDiv.classList.remove('lecture');
                        classSlotDiv.classList.add('empty');
                    }
                } catch (error) {
                    // If authenticatedFetch throws an error, it will be caught here.
                    console.error('Error deleting schedule slot:', error);
                    alert(`Failed to delete schedule slot: ${error.message}`);
                }
            }
        } else {
            const targetSlot = e.target.closest('.class-slot');
            if (targetSlot && targetSlot.classList.contains('empty')) {
                openScheduleSlotModal(targetSlot.dataset.day, targetSlot.dataset.timeSlot, { slotId: targetSlot.dataset.slotId });
            }
        }
    });

    // Open schedule slot modal
    async function fetchSubjects() { return []; }
    async function fetchAndPopulateDropdown(endpoint, selectElementId, selectedValue) {
        const selectElement = document.getElementById(selectElementId);
        if (!selectElement) {
            console.error(`Dropdown element with ID ${selectElementId} not found.`);
            return;
        }

        try {
            const data = await authenticatedFetch(`${API_BASE_URL}/${endpoint}`);

            const placeholderMap = {
                teachers: 'Select Teacher',
                subjects: 'Select Subject',
                classes: 'Select Class'
            };
            selectElement.innerHTML = `<option value="">${placeholderMap[endpoint]}</option>`;

            data.forEach(item => {
                const option = document.createElement('option');
                let value, text;

                if (endpoint === 'teachers') {
                    text = `${item.firstName} ${item.lastName}`;
                    value = text;
                } else if (endpoint === 'subjects') {
                    text = item.name;
                    value = item.name;
                } else if (endpoint === 'classes') {
                    // Correctly combine department, batch, and semester from the Class model
                    text = `${item.department} - ${item.batch} (Semester ${item.semester})`;
                    value = text;
                }

                option.value = value;
                option.textContent = text;

                // Pre-select the option if it matches the existing schedule data
                if (value === selectedValue) {
                    option.selected = true;
                }
                selectElement.appendChild(option);
            });
        } catch (error) {
            console.error(`Error fetching or populating ${endpoint}:`, error);
        }
    }

    async function fetchSubjects() { return []; }



    function openScheduleSlotModal(slotId, day, timeSlot, scheduleData = {}) {
        const modal = document.getElementById('scheduleSlotModal');
        if (!modal) {
            console.error('Modal not found');
            return;
        }

        // Use correct IDs from HTML
        document.getElementById('scheduleSlotIdDisplay').textContent = slotId;
        document.getElementById('scheduleSlotId').value = slotId;
        document.getElementById('scheduleSlotDay').value = day;
        document.getElementById('scheduleSlotTime').value = timeSlot;

        // Populate fields with existing data or clear them
        document.getElementById('scheduleSlotRoom').value = scheduleData.room || '';

        // Fetch and populate dropdowns, then set selected value if available
        fetchAndPopulateDropdown('teachers', 'scheduleSlotTeacher', scheduleData.teacherName);
        fetchAndPopulateDropdown('subjects', 'scheduleSlotSubject', scheduleData.subjectName);
        // The schedule data uses 'program' for the department.
        const selectedClassValue = scheduleData.program && scheduleData.batch && scheduleData.semester
            ? `${scheduleData.program} - ${scheduleData.batch} (Semester ${scheduleData.semester})`
            : '';
        fetchAndPopulateDropdown('classes', 'scheduleSlotClass', selectedClassValue);

        modal.style.display = 'block';
    }

    // Handle schedule slot form submission
    scheduleSlotForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const selectedClassValue = document.getElementById('scheduleSlotClass').value;

        // Use regex to safely parse department, batch, and semester
        const classRegex = /^(.+?) - (.+?) \(Semester (\d+)\)$/;
        const match = selectedClassValue.match(classRegex);

        let program = null, batch = null, semester = null;
        if (match) {
            program = match[1];
            batch = match[2];
            semester = match[3];
        }

        const scheduleData = {
            slotId: document.getElementById('scheduleSlotId').value,
            day: document.getElementById('scheduleSlotDay').value,
            timeSlot: document.getElementById('scheduleSlotTime').value,
            subjectName: document.getElementById('scheduleSlotSubject').value,
            teacherName: document.getElementById('scheduleSlotTeacher').value,
            semester: semester,
            room: document.getElementById('scheduleSlotRoom').value
        };

        // Combine department and batch into the program field for filtering
        if (program && batch) {
            scheduleData.program = `${program.trim()} ${batch.trim()}`;
        }

        try {
            // The backend is designed to handle both create and update via this single bulk endpoint
            const response = await authenticatedFetch(`${API_BASE_URL}/lectureSchedules/bulk`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify([scheduleData]) // Send as an array with one item
            });

            // authenticatedFetch returns parsed JSON, not a Response object.
            // A successful response from the bulk endpoint includes a 'message' property.
            if (response && response.message) {
                closeModal(scheduleSlotModal);
                await fetchLectureSchedulesInternal(classFilter.value);
            } else {
                // If there's an error, the response object itself contains the error message.
                alert(`Failed to save schedule slot: ${response.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error saving schedule slot:', error);
            alert('An error occurred while saving the schedule slot.');
        }
    });

    // Close schedule slot modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === scheduleSlotModal) scheduleSlotModal.style.display = 'none';
    });
    scheduleSlotModal.querySelector('.close-button').addEventListener('click', () => {
        closeModal(scheduleSlotModal);
    });

    // Initial fetch of lecture schedules
    fetchLectureSchedulesInternal();

    // Upload Schedule: Gather all slots and POST to backend
    document.getElementById('uploadCurrentScheduleBtn').addEventListener('click', async () => {
        const allSlotsData = [];
        document.querySelectorAll('.class-slot').forEach(slotDiv => {
            const subjectName = slotDiv.querySelector('.subject-name')?.textContent.trim() || '';
            // Only include slots that have been assigned a subject.
            // This prevents empty, un-edited slots from being created in the DB.
            if (subjectName) {
                allSlotsData.push({
                    slotId: slotDiv.dataset.slotId,
                    day: slotDiv.dataset.day,
                    timeSlot: slotDiv.dataset.timeSlot,
                    subjectName: subjectName,
                    teacherName: slotDiv.querySelector('.teacher-name')?.textContent.trim() || '',
                    program: slotDiv.querySelector('.program')?.textContent.trim() || '',
                    room: slotDiv.querySelector('.room')?.textContent.replace('Room:', '').trim() || ''
                });
            }
        });

        if (allSlotsData.length === 0) {
            alert('No schedule data to upload. Please edit some slots first.');
            return;
        }

        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/lectureSchedules/bulk`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(allSlotsData)
            });

            if (response && response.ok) {
                alert('Schedule uploaded successfully!');
                await fetchLectureSchedulesInternal(classFilter.value);
            } else {
                const errorData = await response.json();
                alert(`Failed to upload schedule: ${errorData.error}`);
            }
        } catch (error) {
            console.error('Error uploading schedule:', error);
            alert('An error occurred while uploading the schedule.');
        }
    });
    return {
        fetchLectureSchedules: fetchLectureSchedulesInternal
    };

}