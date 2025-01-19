import { CONFIG } from "../config";
import {SignalingChannel} from "./signaling";
import {Message} from "../model/message";


export class PeerConnection {
    private pc: RTCPeerConnection;
    private isInitiator: boolean;
    private queuedIceCandidates: RTCIceCandidate[] = [];
    private signalingChannel: SignalingChannel;
    private targetPeerId: string;
    private chatDataChannel: RTCDataChannel | null = null;
    private chatDataChannelName: string = 'chat_channel';
    private onmessage: (message: Message) => void;
    private onStream: (stream: MediaStream) => void;
    private negotiating: boolean = false;
    private localStream: MediaStream | null = null;

    constructor(
        isInitiator: boolean,
        signalingChannel: SignalingChannel,
        targetPeerId: string,
        onmessage: (message: Message) => void,
        onStream: (stream: MediaStream) => void
    ) {
        this.pc = new RTCPeerConnection({
            iceServers: CONFIG.iceServers,
        });
        this.isInitiator = isInitiator;
        this.signalingChannel = signalingChannel;
        this.targetPeerId = targetPeerId;
        this.onmessage = onmessage;
        this.onStream = onStream;

        this.SetupPeerConnection().then(() => {
            console.log(`Peer connection setup completed for ${targetPeerId}`);
        });

        this.monitorConnectionState();
    }

    async sendMessage(messageText: string): Promise<void> {
        if (!this.isReady()) {
            throw new Error('Connection not ready');
        }

        try {
            this.chatDataChannel?.send(messageText);
        } catch (error) {
            throw error;
        }
    }

    isReady(): boolean {
        if (!this.pc || !this.chatDataChannel) {return false}
        return (
            this.pc.connectionState === 'connected' &&
            this.chatDataChannel.readyState === 'open'
        );
    }

    public async SetupPeerConnection(): Promise<void> {
        if (this.isInitiator) {
            this.chatDataChannel = this.pc.createDataChannel(this.chatDataChannelName);
            this.setupDataChannelEvents(this.chatDataChannel);
        } else {
            this.pc.ondatachannel = (event) => {
                this.chatDataChannel = event.channel;
                this.setupDataChannelEvents(this.chatDataChannel);
            };
        }

        this.pc.onicecandidate = (event) => this.HandleIceCandidate(event);

        this.pc.onnegotiationneeded = async () => {
            if (this.negotiating) {
                return;
            }
            try {
                this.negotiating = true;
                await this.CreateOffer();
            } catch (error) {
            } finally {
                this.negotiating = false;
            }
        };

        this.pc.ontrack = (event) => {
            if (this.onStream) {
                this.onStream(event.streams[0]);
            }
        };
    }

    async addLocalStream(stream: MediaStream): Promise<void> {
        this.localStream = stream;
        stream.getTracks().forEach((track) => {
            this.pc.addTrack(track, stream);
        });
    }

    async waitForConnection(): Promise<void> {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Connection timeout'));
            }, 10000);

            const checkConnection = () => {
                if (this.isReady() && this.chatDataChannel?.readyState === 'open') {
                    clearTimeout(timeout);
                    resolve();
                } else if (
                    this.pc.connectionState === 'failed' ||
                    this.pc.connectionState === 'closed'
                ) {
                    clearTimeout(timeout);
                    reject(new Error('Connection failed'));
                } else {
                    setTimeout(checkConnection, 100);
                }
            };

            checkConnection();
        });
    }

    monitorConnectionState(): void {
        this.pc.addEventListener('iceconnectionstatechange', () => {
            switch (this.pc.connectionState) {
                case 'connected':
                    console.log('Connection established');
                    break;
                case 'disconnected':
                case 'failed':
                    console.warn('Connection lost.');
                    break;
                case 'closed':
                    console.log('Connection closed');
                    break;
            }
        });
    }

    setupDataChannelEvents(channel: RTCDataChannel): void {
        channel.onmessage = (event) => {
            try {
                this.onmessage(event.data);
            } catch (error) {
                console.error('[WebRTC] Error handling message:', error);
            }
        };

        channel.onopen = () => {
            console.log(`[WebRTC] Data channel '${channel.label}' opened`);
        };

        channel.onclose = () => {
            console.warn(`[WebRTC] Data channel '${channel.label}' closed`);
        };

        channel.onerror = (error) => {
            console.error(`[WebRTC] Data channel error:`, error);
        };
    }

    public async CreateOffer(): Promise<void> {
        if (this.pc.signalingState !== 'stable') {
            console.warn('[WebRTC] Signaling state not stable, skipping offer creation');
            return;
        }

        const offer = await this.pc.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true,
            iceRestart: this.pc.connectionState === 'failed',
        });
        await this.pc.setLocalDescription(offer);
        if (!this.pc || !this.pc.localDescription) {
            throw new Error('Local description not set');
        }
        this.signalingChannel.Send({
            type: 'offer',

            sdp: this.pc.localDescription,
            target: this.targetPeerId,
        });
    }

    public async CreateAnswer(offer: RTCSessionDescriptionInit): Promise<void> {
        await this.pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await this.pc.createAnswer();
        await this.pc.setLocalDescription(answer);
        if (!this.pc.localDescription) {
            throw new Error('Local description not set');
        }

        this.signalingChannel.Send({
            type: 'answer',
            sdp: this.pc.localDescription,
            target: this.targetPeerId,
        });
    }

    public async AddIceCandidate(candidate: RTCIceCandidate): Promise<void> {
        if (!this.pc.remoteDescription) {
            console.warn('[WebRTC] Queuing ICE candidate as remote description is not set');
            this.queuedIceCandidates.push(candidate);
            return;
        }
        try {
            await this.pc.addIceCandidate(candidate);
        } catch (error) {
            console.error('[WebRTC] Error adding ICE candidate:', error);
        }
    }

    public async HandleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
        try {
            await this.pc.setRemoteDescription(answer);

            while (this.queuedIceCandidates.length > 0) {
                const candidate = this.queuedIceCandidates.shift();
                if (candidate) {
                    await this.AddIceCandidate(candidate);
                }
            }
        } catch (error) {
            console.error('[WebRTC] Error handling answer:', error);
            throw error;
        }
    }

    public HandleIceCandidate(event: RTCPeerConnectionIceEvent): void {

        if (event.candidate) {
            this.signalingChannel.Send({
                type: 'candidate',
                candidate: event.candidate,
                target: this.targetPeerId,
            });
        }
    }

    public Close(): void {
        if (this.localStream) {
            this.localStream.getTracks().forEach((track) => track.stop());
        }
        this.pc.close();
    }

    public GetWebRTCConnection(): RTCPeerConnection {
        return this.pc;
    }
}


