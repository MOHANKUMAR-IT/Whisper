// config.js
export const CONFIG = {
    signalingUrl: `ws://${getServerAddress()}:8080/ws`,
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
    ]
};

function getServerAddress() {
    // Implement logic to retrieve server address if needed
    return window.location.hostname; // Example placeholder
}
