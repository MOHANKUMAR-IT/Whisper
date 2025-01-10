// config.js

const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';

export const CONFIG = {
    signalingUrl: `${protocol}${getServerAddress()}/ws`,
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
    ]
};

function getServerAddress() {
    // Implement logic to retrieve server address if needed
    return window.location.hostname; // Example placeholder
}
