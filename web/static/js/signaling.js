// signaling.js
import {CONFIG} from "./config.js";

export class SignalingChannel {
    constructor(localPeerID, onMessage) {
        this.localPeerID = localPeerID;
        const wsUrl = `${CONFIG.signalingUrl}?id=${this.localPeerID}`;

        this.socket = new WebSocket(wsUrl);
        this.socket.onmessage = onMessage;
        this.socket.onopen = () => console.log('[WebSocket] Connected');
        this.socket.onclose = () => console.log('[WebSocket] Disconnected');
        this.socket.onerror = (error) => console.error('[WebSocket] Error:', error);
    }

    send(message) {
        if (this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(message));
        }
    }
}