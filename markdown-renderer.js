// Add this script to your HTML files
document.addEventListener('DOMContentLoaded', (event) => {
    const contentElement = document.getElementById('content');
    if (contentElement && window.location.pathname.endsWith('.md')) {
        fetch(window.location.pathname)
            .then(response => response.text())
            .then(text => {
                contentElement.innerHTML = marked(text);
            });
    }
});