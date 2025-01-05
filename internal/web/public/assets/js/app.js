// app.js
import { SignalingChannel } from './signaling.js';
import { PeerConnection } from './peerConnection.js';
import { CONFIG } from './config.js';
import {ContactManager} from "./contactManager.js";

document.addEventListener('DOMContentLoaded', () => {
    let signalingChannel;
    let peerConnection;
    let currentPeerId = null;

    // UI Element Selectors
    const registerButton = document.getElementById('register');
    const connectButton = document.getElementById('connect');
    const sendButton = document.getElementById('send');
    const localPeerIdInput = document.getElementById('localPeerID');
    const remotePeerIdInput = document.getElementById('remotePeerID');
    const messageInput = document.getElementById('messageInput');
    const chatLog = document.getElementById('chatLog');
    const contactList = document.getElementById('contactList');

    window.contactManager = new ContactManager();

    // Event Listeners
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendButton.click();
        }
    });

    // Register User
    registerButton.onclick = async () => {
        const localPeerID = localPeerIdInput.value.trim();
        if (!localPeerID) {
            addMessage('Please enter a valid User ID');
            return;
        }

        try {
            signalingChannel = new SignalingChannel(localPeerID, handleSocketMessage);

            addMessage(`Registered as: ${localPeerID}`);
            localPeerIdInput.disabled = true;
            localPeerIdInput.style.display = 'none';
            registerButton.disabled = true;
            registerButton.style.display = 'none';
        } catch (error) {
            console.error('[WebSocket] Connection error:', error);
            addMessage('Failed to connect to the signaling server.');
        }
    };

    // Connect to Peer
    connectButton.onclick = () => {
        const peerId = remotePeerIdInput.value.trim();
        if (!peerId) {
            addMessage('Please enter a valid Peer ID');
            return;
        }

        if (!signalingChannel) {
            addMessage('Please register first');
            return;
        }

        startConnection(peerId);

    };

    // Send Message
    sendButton.onclick = () => {
        const message = messageInput.value.trim();
        if (!message) {
            return;
        }

        if (!peerConnection?.sendChannel || peerConnection.sendChannel.readyState !== 'open') {
            addMessage('Error: Connection not established');
            return;
        }

        try {
            peerConnection.sendChannel.send(message);
            addMessage(`You: ${message}`);
            messageInput.value = '';
        } catch (error) {
            console.error('[WebRTC] Send error:', error);
            addMessage('Failed to send message');
        }
    };

    // Handle WebSocket Messages
    function handleSocketMessage(event) {
        const message = JSON.parse(event.data);

        switch (message.type) {
            case 'offer':
                handleOffer(message);
                break;
            case 'answer':
                handleAnswer(message);
                break;
            case 'candidate':
                handleCandidate(message);
                break;
            case 'contacts':
                handleContacts(message.data);
                break;
            default:
                console.warn('[WebSocket] Unknown message type:', message.type);
        }
    }

    // Handle ICE Candidate
    function handleCandidate(message) {
        if (!peerConnection) return;

        try {
            peerConnection.addIceCandidate(message.candidate)
                .catch(error => console.error('[WebRTC] Error adding ICE candidate:', error));
        } catch (error) {
            console.error('[WebRTC] Error processing ICE candidate:', error);
        }
    }

    // Handle Contacts Update
    function handleContacts(message) {
        if (message.action === '+') {
            window.contactManager.addContact(message.peer,(peerId) => {
                startConnection(peerId);
            });
        } else {
            window.contactManager.removeContact(message.peer);
        }
    }

    // Start Peer Connection
    async function startConnection(peerId) {
        if (peerConnection) {
            peerConnection.close();
        }
        currentPeerId = peerId;
        try {
            peerConnection = new PeerConnection(
                true,
                signalingChannel,
                peerId,
                handleReceivedMessage
            );
            addMessage(`Connecting to ${peerId}...`);
        } catch (error) {
            console.error('[WebRTC] Connection error:', error);
            addMessage(`Failed to connect to ${peerId}`);
        }
    }

    // Handle Received Message
    function handleReceivedMessage(message) {
        addMessage(`${currentPeerId}: ${message}`);
    }

    // Handle Offer
    async function handleOffer(offer) {
        try {
            if (peerConnection) {
                peerConnection.close();
            }

            currentPeerId = offer.from;
            peerConnection = new PeerConnection(
                false,
                signalingChannel,
                offer.from,
                handleReceivedMessage
            );
            console.log('[WebRTC] Received offer from:', offer);
            await peerConnection.createAnswer(offer.sdp);
            addMessage(`Connected with ${offer.from}`);
        } catch (error) {
            console.error('[WebRTC] Offer handling error:', error);
            addMessage('Failed to establish connection');
        }
    }

    // Handle Answer
    async function handleAnswer(message) {
        if (!peerConnection) return;

        try {
            await peerConnection.handleAnswer(message.sdp);
            addMessage('Connection established');
        } catch (error) {
            console.error('[WebRTC] Answer handling error:', error);
            addMessage('Failed to complete connection');
        }
    }


    // Add Message
    function addMessage(message) {
        const messageElement = document.createElement('p');
        messageElement.textContent = message;
        chatLog.appendChild(messageElement);
        chatLog.scrollTop = chatLog.scrollHeight;
    }
});