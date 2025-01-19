import {SignalingChannel} from './services/signaling';
import { Usermanager } from './services/usermanager';
import { PeerConnection } from './services/peerconnection'; // Import the new ConnectionManager
import "core-js/es/promise";
import {MessageDB} from "./services/messagedb";


interface SignalEvent {
    type: string;
    from?: string;
    sdp?: RTCSessionDescriptionInit;
    candidate?: RTCIceCandidate;
    data?: any;
}

interface ContactMessage {
    peer: string;
    nickname: string;
    action: '+' | '-';
}

export class ChatApp {
    private signalingChannel: SignalingChannel | null = null;
    private userManager: Usermanager | undefined;
    private readonly nickname: string;
    private readonly peerid: string;

    constructor(peerid: string,nickname: string) {
        console.log(`${nickname} is initialized`);
        this.nickname = nickname;
        this.peerid = peerid;
        this.autoRegister().then(() => console.log('Auto register completed'));
    }

    private async autoRegister(): Promise<void> {

        this.signalingChannel = new SignalingChannel(
            this.peerid,
            this.nickname,
            (event: MessageEvent) => this.handleSocketMessage(event)
        );

        this.userManager = new Usermanager(this.signalingChannel);
    }

    private handleSocketMessage(event: MessageEvent): void {
        const message: SignalEvent = JSON.parse(event.data);

        const handlers: Record<string, (msg: SignalEvent) => void> = {
            offer: (msg) => this.handleOffer(msg),
            answer: (msg) => this.handleAnswer(msg),
            candidate: (msg) => this.handleCandidate(msg),
            contacts: (msg) => this.handleContacts(msg.data as ContactMessage),
    };

        const handler = handlers[message.type];
        if (handler) {
            handler(message);
        } else {
            console.warn('Unknown message type:', message.type);
        }
    }

    private handleContacts(message: ContactMessage): void {
        const { peer, action ,nickname} = message;
        if (action === '+') {
            this.userManager?.AddContact(peer, nickname);
        } else {
            this.userManager?.RemoveContact(peer);
        }
    }

    private handleCandidate(message: SignalEvent): void {
        const peerConnection = this.userManager?.GetConnection(message.from!);

        if (!peerConnection) {
            console.warn('No connection found for peer:', message.from);
            return;
        }

        try {
            peerConnection.AddIceCandidate(message.candidate!)
        .catch((error: any) => console.error('[WebRTC] Error adding ICE candidate:', error));
        } catch (error) {
            console.error('Error processing ICE candidate:', error);
        }
    }

    private async handleOffer(offer: SignalEvent): Promise<void> {
        try {
            const connection = this.userManager?.GetConnection(offer.from!);
            await connection?.CreateAnswer(offer.sdp!);
        } catch (error) {
            console.error('Offer handling error:', error);
        }
    }

    private async handleAnswer(message: SignalEvent): Promise<void> {
        try {
            const connection = this.userManager?.GetConnection(message.from!);
            await connection?.HandleAnswer(message.sdp!);
        } catch (error) {
            console.error('Answer handling error:', error);
        }
    }
}
