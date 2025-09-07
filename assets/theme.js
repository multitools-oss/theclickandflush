(function() {
    function setTheme() {
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }
    
    // Set initial theme
    setTheme();
    
    // Listen for changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', setTheme);
})();
