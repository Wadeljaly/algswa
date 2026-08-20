/**
 * Entry Point - Al-Qaswaa POS
 * Connects all modules and performs final app initialization
 */

console.log("Al-Qaswaa POS Initializing...");

// Any Electron-specific messaging can go here
// if (window.process && window.process.type === 'renderer') { console.log("Running in Electron mode"); }

// Global handle for Al-Qaswaa instance
const AlQaswaa = {
    version: "1.0.0",
    developer: "محمد الجعلي الحسين",
    status: "Stable"
};

// Check for updates or local environment configuration
window.onload = () => {
   // Lucide icons already handled in main.js, but ensures they load
   if (typeof lucide !== 'undefined') {
        lucide.createIcons();
   }
};
