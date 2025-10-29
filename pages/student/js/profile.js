// Get DOM elements
const studentNameElement = document.getElementById('studentName');
const profileHeaderFullNameElement = document.getElementById('profileHeaderFullName');
const profileHeaderDepartmentElement = document.getElementById('profileHeaderDepartment');
const fullNameElement = document.getElementById('fullName');
const fatherNameElement = document.getElementById('fatherName');
const cnicElement = document.getElementById('cnic');
const emailElement = document.getElementById('email');
const phoneElement = document.getElementById('phone');
const dobElement = document.getElementById('dob');
const genderElement = document.getElementById('gender');
const departmentElement = document.getElementById('department');
const batchElement = document.getElementById('batch');
const batchSectionElement = document.getElementById('batchSection');
const addressElement = document.getElementById('address');
const emergencyContactElement = document.getElementById('emergencyContact');
const photosGridElement = document.getElementById('photosGrid');
const profilePictureElement = document.getElementById('profilePicture');



// Update profile information
function updateProfile(studentData) {
    const fullName = `${studentData.firstName || ''} ${studentData.lastName || ''}`.trim();
    studentNameElement.textContent = fullName || 'N/A';
    profileHeaderFullNameElement.textContent = fullName || 'N/A';
    profileHeaderDepartmentElement.textContent = studentData.department || 'N/A';
    fullNameElement.textContent = fullName || 'N/A';
    fatherNameElement.textContent = studentData.fatherName || 'N/A';
    cnicElement.textContent = studentData.cnic || 'N/A';
    emailElement.textContent = studentData.email || 'N/A';
    phoneElement.textContent = studentData.phone || 'N/A';
    dobElement.textContent = studentData.dateOfBirth ? new Date(studentData.dateOfBirth).toLocaleDateString() : 'N/A';
    genderElement.textContent = studentData.gender || 'N/A';
    departmentElement.textContent = studentData.department || 'N/A';
    batchElement.textContent = studentData.batch || 'N/A';
    batchSectionElement.textContent = `Batch ${studentData.batch || 'N/A'}`;

    // Handle semester display (integer or string)
    const semesterElement = document.getElementById('semester');
    let semesterDisplay = 'N/A';
    if (studentData.semester !== undefined && studentData.semester !== null && studentData.semester !== '') {
        if (typeof studentData.semester === 'number' || !isNaN(Number(studentData.semester))) {
            semesterDisplay = ` ${studentData.semester}`;
        } else {
            semesterDisplay = studentData.semester;
        }
    }
    if (semesterElement) {
        semesterElement.textContent = semesterDisplay;
    }
    addressElement.textContent = studentData.address || 'N/A';
    emergencyContactElement.textContent = studentData.emergencyContact || 'N/A';

    // Update profile picture
    if (studentData.photos && studentData.photos.length > 0) {
        profilePictureElement.src = studentData.photos[0];
    } else {
        profilePictureElement.src = '../../assets/avatar.png'; // Default avatar if no photos
    }

    // Update photos (if multiple are supported and returned)
    photosGridElement.innerHTML = '';
    if (studentData.photos && Array.isArray(studentData.photos)) {
        studentData.photos.forEach(photo => {
            const photoItem = document.createElement('div');
            photoItem.className = 'photo-item';
            photoItem.innerHTML = `<img src="${photo}" alt="Student Photo">`;
            photosGridElement.appendChild(photoItem);
        });
    }
}

// Handle profile picture change
function handleProfilePictureChange(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const profilePicture = document.getElementById('profilePicture');
            profilePicture.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

// Edit profile function
function editProfile() {
    // In a real application, this would open a modal or redirect to an edit form
    alert('Edit profile functionality will be implemented here');
}

// Initialize profile page
async function initializePage() {
    try {
        const userId = localStorage.getItem('userId');
        if (!userId) {
            console.error('User ID not found in localStorage. Redirecting to login.');
            window.location.href = '../../index.html'; // Redirect to login page
            return;
        }

        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3000/api/students/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const studentData = await response.json();
        
        // Update profile with the fetched data
        updateProfile(studentData);

        // Add event listener for profile picture change
        const changePhotoBtn = document.querySelector('.change-photo-btn');
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        fileInput.addEventListener('change', handleProfilePictureChange);
        
        changePhotoBtn.addEventListener('click', () => fileInput.click());
        document.body.appendChild(fileInput);

    } catch (error) {
        console.error('Error initializing profile:', error);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializePage);
