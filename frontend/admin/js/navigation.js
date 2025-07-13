// Add this to your main admin navigation JavaScript
// This could be in admin.html <script> section or admin/js/navigation.js

// Enhanced navigation function to handle section initialization
function showSection(sectionName) {
    // Hide all sections
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none';
    });
    
    // Remove active class from all nav links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.classList.remove('active');
    });
    
    // Show target section
    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
        targetSection.classList.add('active');
        targetSection.style.display = 'block';
    }
    
    // Add active class to clicked nav link
    const activeLink = document.querySelector(`[data-section="${sectionName}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
    
    // Initialize section-specific functionality
    switch(sectionName) {
        case 'tests':
            // Initialize test management when tests section is shown
            if (typeof initTestManagement === 'function') {
                initTestManagement();
            }
            break;
        case 'supplements':
            // Initialize supplements management if it exists
            if (typeof initSupplementManagement === 'function') {
                initSupplementManagement();
            }
            break;
        case 'analytics':
            // Initialize analytics if it exists
            if (typeof initAnalytics === 'function') {
                initAnalytics();
            }
            break;
        // Add other sections as needed
    }
}

// Update click event listeners for navigation
document.addEventListener('DOMContentLoaded', function() {
    // Set up navigation click handlers
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionName = this.getAttribute('data-section');
            if (sectionName) {
                showSection(sectionName);
            }
        });
    });
    
    // Show default section (overview) on load
    showSection('overview');
});