import { SignalingChannel } from './signaling.js';
import { ContactManager } from './contactManager.js';
import { ConnectionManager } from './connmanager.js'; // Import the new ConnectionManager

export class ChatApp {
    constructor(nickname) {
        this.signalingChannel = null;
        this.connectionManager = new ConnectionManager();
        this.contactManager = new ContactManager(nickname);
        this.nickname = nickname;
        this.handleReceivedMessage = this.handleReceivedMessage.bind(this);
        this.currentPeerId = null;

        this.initializeElements();
        this.attachEventListeners();
        this.autoRegister();
    }

    initializeElements() {
        this.elements = {
            sendButton: document.getElementById('send'),
            messageInput: document.getElementById('messageInput'),
            chatLog: document.getElementById('chatLog'),
            contactList: document.getElementById('contactList'),
            messageForm: document.getElementById('messageForm')
        };
    }

    attachEventListeners() {
        this.elements.messageForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSendMessage();
        });
    }

    async autoRegister() {
        try {
            this.signalingChannel = new SignalingChannel(this.nickname,
                (event) => this.handleSocketMessage(event));
        } catch (error) {
            console.error('[WebSocket] Connection error:', error);
            this.addMessage('Connection error occurred');
        }
    }


    handleSendMessage() {
        const message = this.elements.messageInput.value.trim();
        if (!message) return;

        const connection = this.connectionManager.getConnection(this.currentPeerId);
        if (!connection?.sendChannel || connection.sendChannel.readyState !== 'open') {
            this.addMessage('Error: Connection not established');
            return;
        }

        try {
            connection.sendChannel.send(message);
            this.addMessageToChat(message, true);
            this.elements.messageInput.value = '';
            this.connectionManager.markConnectionActive(this.currentPeerId);
        } catch (error) {
            console.error('[WebRTC] Send error:', error);
            this.addMessage('Failed to send message');
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
            console.warn('[WebSocket] Unknown message type:', message.type);
        }
    }

    addMessageToChat(message, isOutgoing = false) {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${isOutgoing ? 'outgoing' : ''}`;
        messageElement.textContent = isOutgoing ? `You: ${message}` :
            `${this.currentPeerId}: ${message}`;
        this.elements.chatLog.appendChild(messageElement);
        this.elements.chatLog.scrollTop = this.elements.chatLog.scrollHeight;
    }

    addMessage(text) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message';
        messageElement.textContent = text;
        this.elements.chatLog.appendChild(messageElement);
        this.elements.chatLog.scrollTop = this.elements.chatLog.scrollHeight;
    }

    handleContacts(message) {
        const { peer, action } = message;
        if (action === '+') {
            this.contactManager.addContact(peer, (peerId) => {
                this.currentPeerId = peerId;
                const connection = this.connectionManager.getConnection(
                    peerId,
                    this.signalingChannel,
                    this.handleReceivedMessage
                );
                this.addMessage(`Connecting to ${peerId}...`);
            });
        } else {
            this.contactManager.removeContact(peer);
            this.connectionManager.closeConnection(peer);
        }
    }

    handleCandidate(message) {
        if (!this.peerConnection) return;

        try {
            this.peerConnection.addIceCandidate(message.candidate)
                .catch(error => console.error('[WebRTC] Error adding ICE candidate:', error));
        } catch (error) {
            console.error('[WebRTC] Error processing ICE candidate:', error);
        }
    }

    handleReceivedMessage(message) {
        this.addMessage(`${this.currentPeerId}: ${message}`);
        this.connectionManager.markConnectionActive(this.currentPeerId);
    }

    async handleOffer(offer) {
        try {
            const connection = this.connectionManager.getConnection(offer.from, this.signalingChannel, this.handleReceivedMessage);
            this.addMessage(`Received offer from ${offer.from}`);
            await connection.createAnswer(offer.sdp);
            this.addMessage(`Connected with ${offer.from}`);
        } catch (error) {
            console.error('[WebRTC] Offer handling error:', error);
            this.addMessage('Failed to establish connection');
        }
    }

    async handleAnswer(message) {
        try {
            const connection = this.connectionManager.getConnection(message.from, this.signalingChannel, this.handleReceivedMessage);
            await connection.handleAnswer(message.sdp);
            this.addMessage('Connection state: ' + connection.pc.connectionState);
        } catch (error) {
            console.error('[WebRTC] Answer handling error:', error);
            this.addMessage('Failed to complete connection');
        }
    }
}
