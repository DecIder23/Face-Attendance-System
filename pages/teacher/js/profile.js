// Get DOM elements
const teacherNameElement = document.getElementById('teacherName');
const fullNameElement = document.getElementById('fullName');
const fatherNameElement = document.getElementById('fatherName');
const cnicElement = document.getElementById('cnic');
const emailElement = document.getElementById('email');
const phoneElement = document.getElementById('phone');
const dobElement = document.getElementById('dob');
const genderElement = document.getElementById('gender');
const departmentElement = document.getElementById('department');
const addressElement = document.getElementById('address');
const emergencyContactElement = document.getElementById('emergencyContact');
const photosGridElement = document.getElementById('photosGrid');
const profilePictureElement = document.getElementById('profilePicture');
const profileHeaderFullNameElement = document.getElementById('headerFullName');
const profileHeaderDepartmentElement = document.getElementById('headerDepartment');



// Update profile information
function updateProfile(teacherData) {
    let fullName = '';
    if (teacherData.firstName || teacherData.lastName) {
        fullName = `${teacherData.firstName || ''} ${teacherData.lastName || ''}`.trim();
    } else if (teacherData.name) {
        fullName = teacherData.name;
    }
    teacherNameElement.textContent = fullName || 'N/A';
    profileHeaderFullNameElement.textContent = fullName || 'N/A';
    profileHeaderDepartmentElement.textContent = teacherData.department || 'N/A';
    fullNameElement.textContent = fullName || 'N/A';
    departmentElement.textContent = teacherData.department || 'N/A';
    fatherNameElement.textContent = teacherData.fatherName || 'N/A';
    cnicElement.textContent = teacherData.cnic || 'N/A';
    emailElement.textContent = teacherData.email || 'N/A';
    phoneElement.textContent = teacherData.phone || 'N/A';
    dobElement.textContent = teacherData.dateOfBirth ? new Date(teacherData.dateOfBirth).toLocaleDateString() : 'N/A';
    genderElement.textContent = teacherData.gender || 'N/A';
    addressElement.textContent = teacherData.address || 'N/A';
    emergencyContactElement.textContent = teacherData.emergencyContact || 'N/A';

    // Update profile picture
    if (teacherData.photos && teacherData.photos.length > 0) {
        profilePictureElement.src = teacherData.photos[0];
    } else {
        profilePictureElement.src = '../../assets/avatar.png'; // Default avatar if no photos
    }

    // Update photos (if multiple are supported and returned)
    photosGridElement.innerHTML = '';
    if (teacherData.photos && Array.isArray(teacherData.photos)) {
        teacherData.photos.forEach(photo => {
            const photoItem = document.createElement('div');
            photoItem.className = 'photo-item';
            photoItem.innerHTML = `<img src="${photo}" alt="Teacher Photo">`;
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

// Initialize page
async function initializePage() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '../../index.html';
            return;
        }

        const response = await fetch('http://localhost:3000/api/teachers/profile', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                // Token expired or invalid
                localStorage.removeItem('token');
                window.location.href = '../../index.html';
            } else {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        }

        const data = await response.json();
        console.log('Data received from backend:', data);
        
        // Update profile with the fetched data
        updateProfile(data.teacher);

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
