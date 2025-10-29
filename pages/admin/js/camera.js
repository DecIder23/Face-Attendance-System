// --- Dynamically Set Base Paths ---
// This logic constructs the correct base URL to avoid server pathing issues.
const getUrl = (path) => {
    const currentUrl = window.location.href;
    const baseUrl = currentUrl.substring(0, currentUrl.lastIndexOf('/pages/'));
    return `${baseUrl}${path}`;
};

const MODELS_URL = getUrl('/models/weights');
const STUDENT_IMAGE_DIR = getUrl('/uploads/');
const API_BASE_URL = 'http://localhost:3000/api';

// --- DOM Elements ---
const videoModal = document.getElementById('video-modal');
const video = document.getElementById('video');
const overlay = document.getElementById('overlay');
const modalCloseBtn = videoModal.querySelector('.close-btn');
const stopButton = document.getElementById('stop-camera-btn');
const modalCameraName = document.getElementById('modal-camera-name');

// --- State ---
let stream = null;
let intervalId = null;
let labeledFaceDescriptors = null;

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    loadModelsAndData();
    setupEventListeners();
    scanCameras();
});

async function loadModelsAndData() {
    try {
        console.log("Loading face detection models...");
        await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(MODELS_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(MODELS_URL),
            faceapi.nets.faceRecognitionNet.loadFromUri(MODELS_URL),
            faceapi.nets.ssdMobilenetv1.loadFromUri(MODELS_URL)
        ]);
        console.log("Models loaded successfully.");

                console.log("Loading student face descriptors...");
        labeledFaceDescriptors = await getLabeledFaceDescriptors();
        if (!labeledFaceDescriptors || labeledFaceDescriptors.length === 0) {
            console.warn("Could not load any student face descriptors. Recognition will not work.");
            alert("Warning: Could not load student face data. Face recognition will be disabled.");
        } else {
            console.log(`Successfully loaded ${labeledFaceDescriptors.length} student face descriptors.`);
        }
    } catch (error) {
        console.error("Fatal error during initialization:", error);
        alert('A critical error occurred while loading face recognition models. Please check the console and refresh the page.');
    }
}

function setupEventListeners() {
    const scanBtn = document.querySelector('.scan-cameras-btn');
    if (scanBtn) scanBtn.addEventListener('click', scanCameras);

    modalCloseBtn.addEventListener('click', stopFaceDetectionStream);
    stopButton.addEventListener('click', stopFaceDetectionStream);
}

// --- Camera Scanning Logic ---
async function scanCameras() {
    const cameraGrid = document.querySelector('.camera-grid');
    const cameraScanning = document.querySelector('.camera-scanning');
    cameraScanning.style.display = 'block';
    cameraGrid.innerHTML = ''; // Clear previous results

    try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
            throw new Error('Media devices API not supported on this browser.');
        }
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter(d => d.kind === 'videoinput');
        updateCameraGrid(videoInputs);
    } catch (err) {
        console.error("Error scanning for cameras:", err);
        cameraGrid.innerHTML = `<div class="no-cameras"><i class="fas fa-exclamation-circle"></i> Error scanning for cameras: ${err.message}</div>`;
    } finally {
        cameraScanning.style.display = 'none';
    }
}

// Smart camera naming function
function getCameraDisplayName(camera, index) {
    const label = camera.label || '';
    const deviceId = camera.deviceId || '';
    
    // Check for external/USB webcam indicators
    if (label.toLowerCase().includes('usb') || 
        label.toLowerCase().includes('external') ||
        label.toLowerCase().includes('webcam') ||
        deviceId.includes('usb') ||
        // Common patterns for external cameras
        label.toLowerCase().includes('logitech') ||
        label.toLowerCase().includes('microsoft') ||
        label.toLowerCase().includes('creative') ||
        label.toLowerCase().includes('razer')) {
        return 'External Camera';
    }
    
    // Check for built-in/integrated camera indicators
    if (label.toLowerCase().includes('integrated') ||
        label.toLowerCase().includes('built-in') ||
        label.toLowerCase().includes('internal') ||
        label.toLowerCase().includes('facetime') ||
        label.toLowerCase().includes('front camera')) {
        return 'Built-in Camera';
    }
    
    // If we have a meaningful label, use it
    if (label && label.trim() !== '' && !label.toLowerCase().includes('camera')) {
        return label;
    }
    
    // Fallback naming based on position
    const fallbackNames = [
        'Primary Camera',
        'Secondary Camera', 
        'Third Camera',
        'Fourth Camera',
        'Additional Camera'
    ];
    
    return fallbackNames[index] || `Camera ${index + 1}`;
}

function updateCameraGrid(cameras) {
    const cameraGrid = document.querySelector('.camera-grid');
    if (cameras.length === 0) {
        cameraGrid.innerHTML = '<div class="no-cameras"><i class="fas fa-video-slash"></i> No cameras found</div>';
        return;
    }

    cameraGrid.innerHTML = cameras.map((camera, index) => {
        // Smart camera naming logic
        let cameraName = getCameraDisplayName(camera, index);
        
        return `
        <div class="camera-card">
            <i class="fas fa-video"></i>
            <p>${cameraName}</p>
            <button class="start-stream-btn" data-device-id="${camera.deviceId}" data-label="${cameraName}">Start Stream</button>
        </div>
        `;
    }).join('');

    document.querySelectorAll('.start-stream-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const { deviceId, label } = e.currentTarget.dataset;
            startFaceDetectionStream(deviceId, label);
        });
    });
}

// --- Face Detection and Recognition Logic ---
async function startFaceDetectionStream(deviceId, label) {
    if (!labeledFaceDescriptors) {
        alert("Face recognition data is not loaded yet. Please wait or check the console for errors.");
        return;
    }

    modalCameraName.textContent = `Live Feed: ${label}`;
    videoModal.style.display = 'flex';

    try {
        // Use more flexible constraints to avoid OverconstrainedError
        const constraints = {
            video: {
                deviceId: deviceId ? { ideal: deviceId } : true,
                width: { ideal: 640 },
                height: { ideal: 480 },
                frameRate: { ideal: 30, max: 60 }
            }
        };
        
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;

        video.onplay = () => {
            const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.55);
                const recordedToday = new Set();
            intervalId = setInterval(async () => {
                const detections = await faceapi.detectAllFaces(video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 })).withFaceLandmarks().withFaceDescriptors();
                const resizedDetections = faceapi.resizeResults(detections, { width: video.width, height: video.height });

                const context = overlay.getContext('2d');
                context.clearRect(0, 0, overlay.width, overlay.height);

                resizedDetections.forEach(async (detection) => {
                    const bestMatch = faceMatcher.findBestMatch(detection.descriptor);
                    if (bestMatch.label !== 'unknown' && !recordedToday.has(bestMatch.label)) {
                        recordedToday.add(bestMatch.label);
                        
                        // Mark attendance using the new attendance API
                        try {
                            const response = await fetch(`${API_BASE_URL}/attendance/mark`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ 
                                    student_name: bestMatch.label,
                                    student_email: null // You can add email mapping if needed
                                })
                            });
                            
                            const result = await response.json();
                            
                            if (result.success) {
                                if (result.alreadyMarked) {
                                    console.log(`${bestMatch.label}: Attendance already marked today`);
                                    showAttendanceNotification(bestMatch.label, 'already-marked');
                                } else {
                                    console.log(`${bestMatch.label}: Attendance marked successfully at ${new Date().toLocaleString()}`);
                                    showAttendanceNotification(bestMatch.label, 'success');
                                }
                            } else {
                                console.error(`Failed to mark attendance for ${bestMatch.label}:`, result.message);
                                showAttendanceNotification(bestMatch.label, 'error');
                            }
                        } catch (err) {
                            console.error('Attendance mark error:', err);
                            showAttendanceNotification(bestMatch.label, 'error');
                        }
                    }
                    const box = detection.detection.box;
                    const drawBox = new faceapi.draw.DrawBox(box, {
                        label: bestMatch.label === 'unknown' ? 'Unknown' : bestMatch.label,
                        boxColor: bestMatch.label === 'unknown' ? 'red' : 'green'
                    });
                    drawBox.draw(overlay);
                });
            }, 100);
        };
    } catch (err) {
        console.error(`Error starting video stream for ${label}:`, err);
        alert(`Could not start stream for ${label}. It might be in use, disconnected, or permissions were denied.`);
        stopFaceDetectionStream(); // Clean up
    }
}

// Show attendance notification to user
function showAttendanceNotification(studentName, status) {
    const notification = document.createElement('div');
    notification.className = `attendance-notification ${status}`;
    
    let message, icon;
    switch (status) {
        case 'success':
            message = `✅ Attendance marked for ${studentName}`;
            icon = 'fas fa-check-circle';
            break;
        case 'already-marked':
            message = `ℹ️ ${studentName} already marked today`;
            icon = 'fas fa-info-circle';
            break;
        case 'error':
            message = `❌ Failed to mark attendance for ${studentName}`;
            icon = 'fas fa-exclamation-circle';
            break;
    }
    
    notification.innerHTML = `
        <i class="${icon}"></i>
        <span>${message}</span>
    `;
    
    // Add to the video modal or body
    const container = document.querySelector('.main-content') || document.body;
    container.appendChild(notification);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}

function stopFaceDetectionStream() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
    }
    video.srcObject = null;
    const context = overlay.getContext('2d');
    context.clearRect(0, 0, overlay.width, overlay.height);
    videoModal.style.display = 'none';
}

async function getLabeledFaceDescriptors() {
    console.log("Attempting to fetch student image list...");
    try {
        // In a real application, you would fetch this list from your server.
        // For this example, we will use a static list as requested.
        // IMPORTANT: The 'uploads' folder must be in your project's root directory.
        // Image names should be like 'FirstName_LastName.jpg'.
        // Fetch dynamic list from backend
    let imageFiles = [];
    try {
        const res = await fetch(`${API_BASE_URL}/images/list-student-images`, { credentials: 'include' });
        imageFiles = await res.json();
    } catch (e) {
        console.error('Could not retrieve student image list, falling back to static list.', e);
        imageFiles = ['Shubham_Hire.jpeg', 'Unknown_Person.jpeg'];
    }
        console.log(`Found image files for processing: ${imageFiles.join(', ')}`);

        if (imageFiles.length === 0) {
            console.warn("No student images found in the placeholder list.");
            return [];
        }

        const labeledDescriptors = await Promise.all(
            imageFiles.map(async imageFile => {
                try {
                    // Extract name from filename, e.g., 'Shubham_Hire.jpeg' -> 'Shubham Hire'
                    const label = imageFile.split('.').slice(0, -1).join('.').replace(/_/g, ' ');
                    const imgUrl = `${STUDENT_IMAGE_DIR}${imageFile}`;
                    const img = await faceapi.fetchImage(imgUrl);
                    const detection = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
                    
                    if (detection) {
                        return new faceapi.LabeledFaceDescriptors(label, [detection.descriptor]);
                    } else {
                        console.warn(`Could not detect a face in ${imageFile}. Skipping.`);
                        return null;
                    }
                } catch (e) {
                    console.error(`Error processing image ${imageFile}:`, e);
                    return null;
                }
            })
        );
        // Filter out any null results from failed detections
        return labeledDescriptors.filter(d => d !== null);

    } catch (error) {
        console.error("Could not get labeled face descriptors:", error);
        return [];
    }
}

function initializeCameraModule() {
    fetchCameras();
}

export default initializeCameraModule;
