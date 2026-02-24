/**
 * KIOSK MODE SCRIPT
 * Handles fullscreen toggle on right-click, disables zoom, and blocks developer tools.
 */

document.addEventListener("DOMContentLoaded", () => {
    // Disable Pinch Zoom (Mobile)
    document.addEventListener('touchmove', function (event) {
        if (event.scale !== 1) { event.preventDefault(); }
    }, { passive: false });

    // Disable Double Tap Zoom (Mobile)
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function (event) {
        const now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, false);

    // Disable Ctrl+Wheel Zoom (Desktop)
    document.addEventListener('wheel', function (e) {
        if (e.ctrlKey) {
            e.preventDefault();
        }
    }, { passive: false });
});

// Right-Click to toggle Fullscreen
document.addEventListener("contextmenu", e => {
    e.preventDefault();
    toggleFullScreen();
}, false);

function toggleFullScreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.log(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

document.addEventListener("keydown", e => {
    // BLOCK ZOOM KEYS (Ctrl + / Ctrl - / Ctrl 0)
    if (e.ctrlKey && (e.key === '+' || e.key === '-' || e.key === '0' || e.key === '=' || e.keyCode === 187 || e.keyCode === 189)) {
        e.preventDefault();
        return;
    }

    // DISABLE F12 and other developer keys (Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U)
    if (e.keyCode === 123 ||
        (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74)) ||
        (e.ctrlKey && e.keyCode === 85)) {
        e.stopPropagation();
        e.preventDefault();
    }
});
