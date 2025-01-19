import { CONFIG } from "../config";


export class SignalingChannel {
    private socket: WebSocket | null = null;
    private localPeerID: string;
    private nickname: string;
    private onMessage: (event: MessageEvent) => void;
    private reconnectInterval: number;

    constructor(localPeerID: string,nickname: string, onMessage: (event: MessageEvent) => void) {
        this.localPeerID = localPeerID;
        this.nickname = nickname;
        this.onMessage = onMessage;
        this.reconnectInterval = 1000;
        this.connect();
    }

    private connect(): void {
        const wsUrl = `${CONFIG.signalingUrl}?id=${this.localPeerID}&nickname=${this.nickname}`;

        this.socket = new WebSocket(wsUrl);

        this.socket.onmessage = this.onMessage;
        this.socket.onclose = () => {
            setTimeout(() => this.connect(), this.reconnectInterval);
        };
        this.socket.onerror = (error) => console.error('[WebSocket] Error:', error);
    }

    public Send(message: unknown): void {
        if (this.socket?.readyState === WebSocket.OPEN) {
            try {
                this.socket.send(JSON.stringify(message));
            } catch (error) {
                console.error('[WebSocket] Failed to send message:', error);
            }
        } else {
            console.warn('[WebSocket] Unable to send message. Socket not open.');
        }
    }

    public IsConnected(): boolean {
        return this.socket?.readyState === WebSocket.OPEN;
    }

}
