// teacher-common.js
// Fetch and display the teacher's name on all teacher pages

function setTeacherNameOnAllPages(teacherData) {
    const nameSpans = document.querySelectorAll('#teacherName');
    let fullName = '';
    if (teacherData.firstName || teacherData.lastName) {
        fullName = `${teacherData.firstName || ''} ${teacherData.lastName || ''}`.trim();
    } else if (teacherData.name) {
        fullName = teacherData.name;
    } else {
        fullName = 'N/A';
    }
    nameSpans.forEach(span => {
        span.textContent = fullName;
    });
}


// Example usage: after fetching teacher data, call setTeacherNameOnAllPages(teacherData)
