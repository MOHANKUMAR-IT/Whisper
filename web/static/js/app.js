import { SignalingChannel } from './signaling.js';
import { ContactManager } from './contactManager.js';
import {PeerConnection} from "./peerConnection.js"; // Import the new ConnectionManager

export class ChatApp {
    constructor(nickname) {
        this.signalingChannel = null;
        this.nickname = nickname;
        this.autoRegister().then(r => console.log('Auto register completed'));
    }

    async autoRegister() {
        try {
            this.signalingChannel = new SignalingChannel(this.nickname,(event) => this.handleSocketMessage(event));
            this.contactManager = new ContactManager(this.signalingChannel);
            this.signalingChannel.socket.addEventListener('close', () => {
                setTimeout(() => {
                    console.log('websocket Reconnecting...');
                    this.autoRegister();
                }, 1000);
            });

        } catch (error) {
            console.error('Connection error:', error);
        }
    }

    handleSocketMessage(event) {
        const message = JSON.parse(event.data);
        const handlers = {
            offer: (msg) => this.handleOffer(msg),
            answer: (msg) => this.handleAnswer(msg),
            candidate: (msg) => this.handleCandidate(msg),
            contacts: (msg) => this.handleContacts(msg.data)
        };

        const handler = handlers[message.type];
        if (handler) {
            handler(message);
        } else {
            console.warn('Unknown message type:', message.type);
        }
    }

    handleContacts(message) {
        const { peer, action } = message;
        if (action === '+') {
            this.contactManager.addContact(peer);
        } else {
            this.contactManager.removeContact(peer);
            this.contactManager.closeConnection(peer);
        }
    }

    handleCandidate(message) {
        let peerConnection = this.contactManager.getConnection(message.from)

        try {
            peerConnection.addIceCandidate(message.candidate)
                .catch(error => console.error('[WebRTC] Error adding ICE candidate:', error));
        } catch (error) {
            console.error('Error processing ICE candidate:', error);
        }
    }

    async handleOffer(offer) {
        try {
            const connection = this.contactManager.createConnection(offer.from);
            await connection.createAnswer(offer.sdp);
        } catch (error) {
            console.error('Offer handling error:', error);
        }
    }

    async handleAnswer(message) {
        try {
            const connection = this.contactManager.getConnection(message.from);
            await connection.handleAnswer(message.sdp);
        } catch (error) {
            console.error('Answer handling error:', error);
        }
    }
}
