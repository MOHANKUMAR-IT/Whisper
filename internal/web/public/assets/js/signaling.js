// signaling.js
import {CONFIG} from "./config.js";

export class SignalingChannel {
    constructor(localPeerID, onMessage) {
        this.localPeerID = localPeerID;
        console.log("Using Websocket URL : ",`${CONFIG.signalingUrl}?id=${localPeerID}`);
        this.socket = new WebSocket(`${CONFIG.signalingUrl}?id=${localPeerID}`);
        this.socket.onmessage = onMessage;
        this.socket.onopen = () => console.log('[WebSocket] Connected to signaling server');
        this.socket.onclose = () => console.log('[WebSocket] Disconnected from signaling server');
        this.socket.onerror = (error) => console.error('[WebSocket] Error:', error);
    }

    send(message) {
        this.socket.send(JSON.stringify(message));
    }
}
