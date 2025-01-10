import {CONFIG} from "./config.js";

export class Peerconnection {
    constructor(isInitiator, signalingChannel, targetPeerId, onmessage) {
        this.pc = new RTCPeerConnection({
            iceServers: CONFIG.iceServers
        });
        this.isInitiator = isInitiator;
        this.signalingChannel = signalingChannel;
        this.targetPeerId = targetPeerId;
        this.sendChannel = null;
        this.onmessage = onmessage;
        this.lastActivityTime = Date.now();

        this.setupPeerConnection();
    }

    async setupPeerConnection() {
        if (this.isInitiator) {
            this.sendChannel = this.pc.createDataChannel("sendChannel");
            this.setupDataChannelEvents(this.sendChannel);
            await this.createOffer();
        } else {
            this.pc.onicecandidate = (event) => this.handleIceCandidate(event);
        }

        this.pc.ondatachannel = (event) => {
            this.sendChannel = event.channel;
            this.setupDataChannelEvents(event.channel);
        }
    }

    setupDataChannelEvents(channel) {
        channel.onmessage = (e) => {
            this.lastActivityTime = Date.now(); // Update activity time
            this.onmessage(e.data);
        };
        channel.onopen = () => console.log("Data channel opened!");
        channel.onclose = () => console.log("Data channel closed!");
    }

    async createOffer() {
        const offer = await this.pc.createOffer();
        await this.pc.setLocalDescription(offer);
        this.signalingChannel.send({
            type: 'offer',
            sdp: this.pc.localDescription,
            target: this.targetPeerId
        });
    }

    close() {
        this.pc.close();
    }

    async createAnswer(offer) {
        await this.pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await this.pc.createAnswer();
        await this.pc.setLocalDescription(answer);
        this.signalingChannel.send({
            type: 'answer',
            sdp: this.pc.localDescription,
            target: this.targetPeerId
        });
    }

    async handleAnswer(answer) {
        await this.pc.setRemoteDescription(new RTCSessionDescription(answer));
        this.pc.onicecandidate = (event) => this.handleIceCandidate(event);
    }

    addIceCandidate(candidate) {
        const iceCandidate = new RTCIceCandidate(candidate);
        return this.pc.addIceCandidate(iceCandidate).catch(e => console.error('Error adding ICE candidate:', e));
    }

    handleIceCandidate(event) {
        if (event.candidate) {
            console.log("NEW ICE candidate!!");
            this.signalingChannel.send({
                type: 'candidate',
                candidate: event.candidate,
                target: this.targetPeerId
            });
        }
    }
}
