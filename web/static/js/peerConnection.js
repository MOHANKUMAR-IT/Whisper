import { CONFIG } from "./config.js";


class ConnectionManager {
    constructor(config = {}) {
        this.maxRetries = config.maxRetries || 3;
        this.baseDelay = config.baseDelay || 1000; // Start with 1 second
        this.maxDelay = config.maxDelay || 10000; // Max 10 seconds
        this.currentRetry = 0;
        this.connectionTimeout = config.connectionTimeout || 30000; // 30 seconds
        this.isConnecting = false;
    }

    async sendMessageWithRetry(peerConnection, messageText, retryCount = 0) {
        try {
            // Wait for connection if connecting
            if (peerConnection.pc.connectionState === 'connecting') {
                await this.waitForConnection(peerConnection);
            }

            // Try to reconnect if disconnected
            if (peerConnection.pc.connectionState === 'disconnected' ||
                peerConnection.pc.connectionState === 'failed' ||
                peerConnection.pc.connectionState === 'closed') {
                await this.reconnect(peerConnection);
            }

            // Attempt to send message
            await peerConnection.chatDataChannel.send(messageText);
            this.currentRetry = 0; // Reset retry counter on success
            return true;

        } catch (error) {
            if (retryCount < this.maxRetries) {
                const delay = this.calculateBackoff(retryCount);
                console.log(`Retry attempt ${retryCount + 1} after ${delay}ms`);
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.sendMessageWithRetry(peerConnection, messageText, retryCount + 1);
            } else {
                throw new Error(`Failed to send message after ${this.maxRetries} attempts: ${error.message}`);
            }
        }
    }

    calculateBackoff(retryCount) {
        // Exponential backoff with jitter
        const exponentialDelay = Math.min(
            this.maxDelay,
            this.baseDelay * Math.pow(2, retryCount)
        );
        // Add random jitter ±15%
        const jitter = exponentialDelay * 0.15;
        return exponentialDelay + (Math.random() * 2 - 1) * jitter;
    }

    async waitForConnection(peerConnection) {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Connection timeout'));
            }, this.connectionTimeout);

            const checkConnection = () => {
                if (peerConnection.isReady()) {
                    clearTimeout(timeout);
                    resolve();
                } else if (peerConnection.pc.connectionState === 'failed' ||
                    peerConnection.pc.connectionState === 'closed') {
                    clearTimeout(timeout);
                    reject(new Error('Connection failed'));
                } else {
                    setTimeout(checkConnection, 100);
                }
            };

            checkConnection();
        });
    }

    async reconnect(peerConnection) {
        if (this.isConnecting) {
            return this.waitForConnection(peerConnection);
        }

        this.isConnecting = true;
        try {
            await peerConnection.setupPeerConnection();
            await this.waitForConnection(peerConnection);
            this.isConnecting = false;
        } catch (error) {
            this.isConnecting = false;
            throw error;
        }
    }
}

export class PeerConnection {
    constructor(isInitiator, signalingChannel, targetPeerId, onmessage) {

        this.isInitiator = isInitiator;
        this.signalingChannel = signalingChannel;
        this.targetPeerId = targetPeerId;
        this.chatDataChannel = null;
        this.chatDataChannelName = 'chat_channel';
        this.onmessage = onmessage;

        this.connectionManager = new ConnectionManager();

        this.setupPeerConnection().then(() => {
            console.log(`Peer connection setup completed for ${targetPeerId}`);
        });

        this.monitorConnectionState();
    }

    async sendMessage(messageText) {
        try {
            await this.connectionManager.sendMessageWithRetry(this, messageText);
            return true;
        } catch (error) {
            console.error('Failed to send message:', error);
            throw error;
        }
    }

    isReady() {
        return this.pc && this.pc.connectionState==='connected' && this.chatDataChannel && this.chatDataChannel.readyState === 'open';
    }

    async setupPeerConnection() {
        this.pc = new RTCPeerConnection({
            iceServers: CONFIG.iceServers,
        });

        if (this.isInitiator) {
            this.chatDataChannel = this.pc.createDataChannel(this.chatDataChannelName);
            this.setupDataChannelEvents(this.chatDataChannel);
        } else {
            this.pc.ondatachannel = (event) => {
                this.chatDataChannel = event.channel;
                this.setupDataChannelEvents(event.channel);
            };
        }

        this.pc.onicecandidate = (event) => this.handleIceCandidate(event);

        if (this.isInitiator) await this.createOffer();
    }



    monitorConnectionState() {
        this.pc.addEventListener('iceconnectionstatechange', () => {
            const state = this.pc.iceConnectionState;
            if (state === 'connected') {
                console.log(`Connected to peer: ${this.targetPeerId}`);
            } else if (state === 'disconnected' || state === 'failed') {
                console.warn(`Connection to peer ${this.targetPeerId} ${state}`);
            }
        });
    }

    setupDataChannelEvents(channel) {
        channel.onmessage = (event) => this.onmessage(event.data);
        channel.onopen = () => console.log("Data channel opened!");
        channel.onclose = () => console.log("Data channel closed!");
    }

    async createOffer() {
        await this.waitForStableSignalingState();
        try {
            const offer = await this.pc.createOffer();
            await this.pc.setLocalDescription(offer);

            this.signalingChannel.send({
                type: 'offer',
                sdp: this.pc.localDescription,
                target: this.targetPeerId,
            });

            console.log('[WebRTC] Offer created and sent');
        } catch (error) {
            console.error('[WebRTC] Error creating offer:', error);
        }
    }

    async createAnswer(offer) {
        try {
            await this.pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await this.pc.createAnswer();
            await this.pc.setLocalDescription(answer);

            this.signalingChannel.send({
                type: 'answer',
                sdp: this.pc.localDescription,
                target: this.targetPeerId,
            });

            console.log('[WebRTC] Answer created and sent');
        } catch (error) {
            console.error('[WebRTC] Error creating answer:', error);
        }
    }

    async handleAnswer(answer) {
        await this.waitForSignalingState('have-local-offer');
        try {
            await this.pc.setRemoteDescription(new RTCSessionDescription(answer));
            console.log('[WebRTC] Answer handled successfully');
        } catch (error) {
            console.error('[WebRTC] Error handling answer:', error);
        }
    }

    async waitForSignalingState(targetState) {
        while (this.pc.signalingState !== targetState) {
            await new Promise((resolve) => setTimeout(resolve, 100));
        }
    }

    async waitForStableSignalingState() {
        await this.waitForSignalingState('stable');
    }

    async addIceCandidate(candidate) {
        try {
            await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) {
            console.error('[WebRTC] Error adding ICE candidate:', error);
        }
    }

    handleIceCandidate(event) {
        if (event.candidate) {
            this.signalingChannel.send({
                type: 'candidate',
                candidate: event.candidate,
                target: this.targetPeerId,
            });
        }
    }

    close() {
        this.pc.close();
    }
}
