// dashboard.js

import initializeClassModule from './class.js';
import initializeSubjectModule from './subject.js';
import initializeTeacherModule from './teacher.js';
import initializeStudentModule from './student.js';

document.addEventListener('DOMContentLoaded', () => {

    // Helper function to close modals
    function closeModal(modalElement) {
        modalElement.style.display = 'none';
    }
    // Check authentication
    if (localStorage.getItem('isLoggedIn') !== 'true' || localStorage.getItem('userRole') !== 'admin') {
        window.location.href = '../../index.html';
        return;
    }

    // Base URL for your backend API
    const API_BASE_URL = 'http://localhost:3000/api';

    // Helper function for authenticated API requests
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

        if (response.status === 401) {
            localStorage.clear();
            window.location.href = '../../index.html';
            throw new Error('Authentication failed');
        }

        if (response.status === 204) {
            return; // For DELETE requests
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'An unknown server error occurred' }));
            throw new Error(errorData.error || 'Server error');
        }

        // For GET requests, parse and return the JSON data.
        // If the response body is empty, return an empty array.
        const text = await response.text();
        return text ? JSON.parse(text) : [];
    }

    // Update dashboard stats
    async function updateDashboardStats() {
        const endpoints = [
            { url: `${API_BASE_URL}/teachers`, id: 'teacherCount' },
            { url: `${API_BASE_URL}/students`, id: 'studentCount' },
            { url: `${API_BASE_URL}/classes`, id: 'classCount' },
            { url: `${API_BASE_URL}/subjects`, id: 'subjectCount' }
        ];

        for (const ep of endpoints) {
            try {
                const data = await authenticatedFetch(ep.url);
                const count = Array.isArray(data) ? data.length : 0;
                const element = document.getElementById(ep.id);
                if (element) {
                    element.textContent = count;
                }
            } catch (error) {
                console.error(`Error fetching stats for ${ep.id}:`, error);
                const element = document.getElementById(ep.id);
                if (element) {
                    element.textContent = '0';
                }
            }
        }
    }

    // Fetch initial data for all modules and then update the dashboard
    async function fetchInitialData() {
        // First, fetch data for all modules that the dashboard might depend on.
        // Using Promise.all to fetch them concurrently for better performance.
        await Promise.all([
            classModule?.fetchClasses?.(),
            teacherModule?.fetchTeachers?.(),
            studentModule?.fetchStudents?.(),
            subjectModule?.fetchSubjects?.()
        ].filter(Boolean)); // Filter out any undefined promises if modules are not loaded

        // After all other data is loaded, update the dashboard stats.
        // This resolves the race condition.
        await updateDashboardStats();

        // Handle modal setup
        const editSlotModal = document.getElementById('editSlotModal');
        if (editSlotModal) {
            editSlotModal.querySelector('.close').addEventListener('click', function() {
                editSlotModal.style.display = 'none';
            });
        }
    }

    // Initialize modules
    const classModule = initializeClassModule({
        closeModal: closeModal,
        fetchInitialData: fetchInitialData,
        API_BASE_URL: API_BASE_URL,
        authenticatedFetch: authenticatedFetch
    });

    // Conditionally initialize subjectModule only if its required DOM elements are present
    const addSubjectBtn = document.getElementById('addSubjectBtn');
    let subjectModule;
    if (addSubjectBtn) {
        subjectModule = initializeSubjectModule({
        closeModal: closeModal,
        fetchInitialData: fetchInitialData,
        API_BASE_URL: API_BASE_URL,
        authenticatedFetch: authenticatedFetch,
        populateTeacherSelect: (selectId) => {
            const teachers = JSON.parse(localStorage.getItem('teachers')) || [];
            const selectElement = document.getElementById(selectId);
            if (selectElement) {
                selectElement.innerHTML = '<option value="">Select Teacher</option>';
                teachers.forEach(teacher => {
                    const option = document.createElement('option');
                    option.value = teacher.id;
                    option.textContent = `${teacher.firstName} ${teacher.lastName}`;
                    selectElement.appendChild(option);
                });
            }
        },
        populateClassSelect: (selectId) => {
            const classes = JSON.parse(localStorage.getItem('classes')) || [];
            const selectElement = document.getElementById(selectId);
            if (selectElement) {
                selectElement.innerHTML = '<option value="">Select Class</option>';
                classes.forEach(cls => {
                    const option = document.createElement('option');
                    option.value = cls.id;
                    option.textContent = `${cls.department} - ${cls.batch} - ${cls.semester} - ${cls.section}`;
                    selectElement.appendChild(option);
                });
            }
        }
    });
    }

    // Conditionally initialize teacherModule only if its required DOM elements are present
    const addTeacherBtn = document.getElementById('addTeacherBtn');
    let teacherModule;
    if (addTeacherBtn) {
        teacherModule = initializeTeacherModule({
        closeModal: closeModal,
        fetchInitialData: fetchInitialData,
        API_BASE_URL: API_BASE_URL,
        authenticatedFetch: authenticatedFetch
    });
    }

    // Conditionally initialize studentModule only if its required DOM elements are present
    const addStudentBtn = document.getElementById('addStudentBtn');
    let studentModule;
    if (addStudentBtn) {
        studentModule = initializeStudentModule({
        closeModal: closeModal,
        fetchInitialData: fetchInitialData,
        API_BASE_URL: API_BASE_URL,
        authenticatedFetch: authenticatedFetch
    });
    }

    // Initial data fetch
    fetchInitialData();

    // Initialize schedule management
    initializeScheduleManagement();

    // Initialize camera management
    function initializeCameraManagement() {
        const cameraGrid = document.querySelector('.camera-grid');
        const cameraScanning = document.querySelector('.camera-scanning');
        let availableDevices = []; // Store available devices
        
        // Function to check for available cameras
        async function checkAvailableCameras() {
            try {
                // Show scanning animation
                cameraGrid.style.display = 'none';
                cameraScanning.style.display = 'flex';
                

                
                // Get list of available cameras
                const devices = await navigator.mediaDevices.enumerateDevices();
                availableDevices = devices.filter(device => device.kind === 'videoinput');
                
                // Hide scanning animation
                cameraScanning.style.display = 'none';
                cameraGrid.style.display = 'grid';
                
                let cameraCardsHtml = '';
                if (availableDevices.length === 0) {
                    cameraCardsHtml = `
                        <div class="no-cameras">
                            <i class="fas fa-video-slash"></i>
                            <p>No cameras found</p>
                        </div>
                    `;
                } else {
                    availableDevices.forEach((device, index) => {
                        cameraCardsHtml += `
                            <div class="camera-card">
                                <div class="camera-info">
                                    <h3>${device.label || `Camera ${index + 1}`}</h3>
                                    <p><i class="fas fa-video"></i> ${device.kind === 'videoinput' ? 'Video Input Device' : 'Unknown Device'}</p>
                                    <p class="camera-status-text">Status: <span class="status-ready">Ready to use</span></p>
                                </div>
                                <div class="camera-actions">
                                    <button class="view-btn" onclick="startExternalCamera('${device.deviceId}', ${index})">
                                        <i class="fas fa-play"></i> Start Camera
                                    </button>
                                    <button class="stop-btn" onclick="stopExternalCamera('${device.deviceId}', ${index})">
                                        <i class="fas fa-stop"></i> Stop Camera
                                    </button>
                                </div>
                                <video id="camera-${index}" data-device-id="${device.deviceId}" autoplay muted style="display: none;"></video>
                            </div>
                        `;
                    });
                }
                cameraGrid.innerHTML = cameraCardsHtml;
            } catch (error) {
                console.error('Error checking cameras:', error);
                cameraScanning.style.display = 'none';
                cameraGrid.style.display = 'grid';
                cameraGrid.innerHTML = `
                    <div class="no-cameras">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Error accessing cameras</p>
                    </div>
                `;
            }
        }

        // Start webcam
        window.startWebcam = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { 
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    } 
                });
                const videoElement = document.getElementById('webcam-preview');
                videoElement.srcObject = stream;
                
                // Update status
                const statusElement = videoElement.parentElement.querySelector('.camera-status');
                statusElement.textContent = 'Webcam Active';
                statusElement.style.background = '#10B981';
                
                // Update status text
                const statusText = document.querySelector('.webcam-card .status-ready');
                statusText.textContent = 'Active';
                statusText.className = 'status-active';
            } catch (error) {
                console.error('Error starting webcam:', error);
                alert('Error starting webcam');
            }
        };

        // Stop webcam
        window.stopWebcam = () => {
            const videoElement = document.getElementById('webcam-preview');
            if (videoElement && videoElement.srcObject) {
                const tracks = videoElement.srcObject.getTracks();
                tracks.forEach(track => track.stop());
                videoElement.srcObject = null;
                
                // Update status
                const statusElement = videoElement.parentElement.querySelector('.camera-status');
                statusElement.textContent = 'Webcam Available';
                statusElement.style.background = '#64748B';
                
                // Update status text
                const statusText = document.querySelector('.webcam-card .status-active');
                statusText.textContent = 'Ready to use';
                statusText.className = 'status-ready';
            }
        };

        // Start external camera
        window.startExternalCamera = async (deviceId, index) => {
            try {
                console.log('Starting external camera:', deviceId, index);
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { 
                        deviceId: deviceId ? { exact: deviceId } : undefined,
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    } 
                });
                
                // Find the video element for this camera
                const videoElement = document.getElementById(`camera-${index}`);
                if (videoElement) {
                    videoElement.srcObject = stream;
                    
                    // Update status
                    const statusElement = videoElement.parentElement.querySelector('.camera-status');
                    statusElement.textContent = 'Camera Active';
                    statusElement.style.background = '#10B981';
                    
                    // Update status text
                    const statusText = videoElement.closest('.camera-card').querySelector('.status-ready');
                    statusText.textContent = 'Active';
                    statusText.className = 'status-active';
                } else {
                    console.error('Video element not found for camera:', index);
                }
            } catch (error) {
                console.error('Error starting external camera:', error);
                alert('Error starting external camera. Please make sure the camera is not being used by another application.');
            }
        };

        // Stop external camera
        window.stopExternalCamera = (deviceId, index) => {
            const videoElement = document.getElementById(`camera-${index}`);
            if (videoElement && videoElement.srcObject) {
                const tracks = videoElement.srcObject.getTracks();
                tracks.forEach(track => track.stop());
                videoElement.srcObject = null;

                // Update status
                const statusElement = videoElement.parentElement.querySelector('.camera-status');
                statusElement.textContent = 'Camera Available';
                statusElement.style.background = '#64748B';
                
                // Update status text
                const statusText = videoElement.closest('.camera-card').querySelector('.status-active');
                statusText.textContent = 'Ready to use';
                statusText.className = 'status-ready';
            }
        };

        // Initial check
        checkAvailableCameras();

        // Check for cameras when navigating to camera section
        document.querySelector('a[data-page="cameras"]').addEventListener('click', () => {
            checkAvailableCameras();
        });
    } // End of initializeCameraManagement

    // Function to collect the current weekly schedule from the UI
    function collectCurrentWeeklySchedule() {
        const schedule = [];
        const rows = scheduleTableBody.querySelectorAll('tr');
        const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        rows.forEach(row => {
            const timeSlot = row.querySelector('td').textContent.trim();
            const cells = row.querySelectorAll('td');
            // Skip the first cell (time)
            for (let i = 1; i < cells.length; i++) {
                const classSlotDiv = cells[i].querySelector('.class-slot');
                if (classSlotDiv && classSlotDiv.classList.contains('lecture')) {
                    // Parse schedule data if available
                    let scheduleData = {};
                    if (classSlotDiv.dataset.scheduleData) {
                        scheduleData = JSON.parse(classSlotDiv.dataset.scheduleData);
                    } else {
                        // Fallback: collect from DOM
                        scheduleData = {
                            subjectName: classSlotDiv.querySelector('.subject-name')?.textContent || '',
                            teacherName: classSlotDiv.querySelector('.teacher-name')?.textContent || '',
                            section: classSlotDiv.querySelector('.section-room')?.textContent.split(' - ')[0] || '',
                            room: classSlotDiv.querySelector('.section-room')?.textContent.split(' - ')[1] || '',
                            day: daysOfWeek[i-1],
                            timeSlot: timeSlot
                        };
                    }
                    schedule.push(scheduleData);
                }
            }
        });
        return schedule;
    }

    // Add event listener for uploading the current weekly schedule
    const uploadCurrentScheduleBtn = document.getElementById('uploadCurrentScheduleBtn');
    if (uploadCurrentScheduleBtn) {
        uploadCurrentScheduleBtn.addEventListener('click', async () => {
            const currentSchedule = collectCurrentWeeklySchedule();
            if (currentSchedule.length === 0) {
                alert('No schedule data to upload.');
                return;
            }
            try {
                const response = await authenticatedFetch(`${API_BASE_URL}/lectureSchedules/bulk`, {
                    method: 'POST',
                    body: JSON.stringify(currentSchedule)
                });
                if (response && response.ok) {
                    alert('Weekly schedule uploaded successfully!');
                    fetchLectureSchedules(classFilter.value);
                } else {
                    const errorData = await response.json();
                    alert(`Failed to upload weekly schedule: ${errorData.error}`);
                }
            } catch (error) {
                console.error('Error uploading weekly schedule:', error);
                alert('An error occurred while uploading the weekly schedule.');
            }
        });
    }
});
