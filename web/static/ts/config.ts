const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';

export const CONFIG: Config = {
    signalingUrl: `${protocol}${getServerAddress()}/ws`,
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
    ],
    reconnectConfig: {
        maxAttempts: 5,
        baseDelay: 1000, // Delay in milliseconds
        maxDelay: 10000 // Maximum delay in milliseconds
    }
};

function getServerAddress(): string {
    // Implement logic to retrieve the server address if needed
    return window.location.hostname; // Example placeholder
}

// Define types for configuration

interface Config {
    signalingUrl: string;
    iceServers: RTCIceServer[];
    reconnectConfig: ReconnectConfig;
}

interface ReconnectConfig {
    maxAttempts: number;
    baseDelay: number;
    maxDelay: number;
}
