// Vybe v19 UI Interactions
document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Splash Screen to Main App Transition
    const getStartedBtn = document.getElementById('get-started-btn');
    const splashScreen = document.getElementById('splash-screen');
    const mainApp = document.getElementById('main-app');

    getStartedBtn.addEventListener('click', () => {
        splashScreen.classList.remove('active');
        splashScreen.classList.add('hidden');
        
        setTimeout(() => {
            mainApp.classList.remove('hidden');
            mainApp.classList.add('active');
        }, 300); // Slight delay for smooth transition
    });

    // 2. Bottom Navigation Tab Switching
    const navIcons = document.querySelectorAll('.nav-icon[data-target]');
    const tabContents = document.querySelectorAll('.tab-content');

    navIcons.forEach(icon => {
        icon.addEventListener('click', () => {
            // Remove active class from all icons
            document.querySelectorAll('.nav-icon').forEach(nav => {
                nav.classList.remove('active-nav');
            });
            // Add active class to clicked icon
            icon.classList.add('active-nav');

            // Hide all tabs
            tabContents.forEach(tab => {
                tab.classList.remove('active-tab');
                tab.classList.add('hidden');
            });

            // Show target tab
            const targetId = icon.getAttribute('data-target');
            const targetTab = document.getElementById(targetId);
            if(targetTab) {
                targetTab.classList.remove('hidden');
                targetTab.classList.add('active-tab');
            }
        });
    });

    // 3. Like Button Interaction
    const heartIcons = document.querySelectorAll('.post-actions .fa-heart');
    heartIcons.forEach(heart => {
        heart.addEventListener('click', function() {
            if (this.classList.contains('fa-regular')) {
                this.classList.remove('fa-regular');
                this.classList.add('fa-solid', 'active-icon');
            } else {
                this.classList.add('fa-regular');
                this.classList.remove('fa-solid', 'active-icon');
            }
        });
    });
});
