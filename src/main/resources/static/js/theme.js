
document.addEventListener('DOMContentLoaded', () => {
    const themeToggleBtn = document.getElementById('btn-theme-toggle');
    if (!themeToggleBtn) return;

    // 1. Read the saved preference from localStorage, default to 'light'
    const storageKey = 'reading_tracker_theme';
    let currentTheme = localStorage.getItem(storageKey) || 'light';

    // 2. Apply theme logic
    const applyTheme = (theme) => {
        // Set the data-theme attribute on the root <html> element
        document.documentElement.setAttribute('data-theme', theme);
        
        // Update the button icon based on the current theme
        if (theme === 'dark') {
            themeToggleBtn.textContent = '☀️';
            themeToggleBtn.setAttribute('title', 'Switch to Light Mode');
        } else {
            themeToggleBtn.textContent = '🌙';
            themeToggleBtn.setAttribute('title', 'Switch to Dark Mode');
        }
    };

    // Apply the initial theme on load
    applyTheme(currentTheme);

    // 3. Add event listener to toggle the theme
    themeToggleBtn.addEventListener('click', () => {
        currentTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        // 4. Save the new choice to localStorage and apply changes
        localStorage.setItem(storageKey, currentTheme);
        applyTheme(currentTheme);
    });
});