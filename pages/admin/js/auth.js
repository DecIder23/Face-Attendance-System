// auth.js

window.logout = function() {
    localStorage.clear();
    window.location.href = '../../index.html';
}
