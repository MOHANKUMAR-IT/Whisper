
export class CallUI {
    private container: HTMLElement;
    private options: { showTimer: boolean; enableChat: boolean; enableScreenShare: boolean };
    // private callManager: CallManager | null = null;
    // private timerInterval: NodeJS.Timeout | null = null;
    private startTime: number | null = null;
    private screenStream: MediaStream | null = null;

    constructor(container: HTMLElement, options: Partial<{ showTimer: boolean; enableChat: boolean; enableScreenShare: boolean }> = {}) {
        this.container = container;
        this.options = {
            showTimer: true,
            enableChat: true,
            enableScreenShare: true,
            ...options
        };
        this.setupUI();
    }

    private setupUI(): void {
        this.container.innerHTML = `
            <div class="call-container d-flex flex-column h-100 bg-dark">
                <div class="call-header p-3 d-flex justify-content-between align-items-center">
                    <div class="call-status text-white"></div>
                    <div class="call-timer text-white-50"></div>
                </div>
                <div class="call-content flex-grow-1 position-relative">
                    <video id="remoteVideo" class="w-100 h-100 object-fit-cover" autoplay playsinline></video>
                    <video id="localVideo" class="position-absolute bottom-0 end-0 m-3" style="width: 200px;" autoplay playsinline muted></video>
                </div>
                <div class="call-controls p-3 d-flex justify-content-center gap-3">
                    <button class="btn btn-outline-light rounded-circle p-3 toggle-audio">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                            <line x1="12" y1="19" x2="12" y2="23"/>
                            <line x1="8" y1="23" x2="16" y2="23"/>
                        </svg>
                    </button>
                    <button class="btn btn-outline-light rounded-circle p-3 toggle-video">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M23 7l-7 5 7 5V7z"/>
                            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                        </svg>
                    </button>
                    ${this.options.enableScreenShare ? `
                        <button class="btn btn-outline-light rounded-circle p-3 toggle-screen-share">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M3 3h18v12h-18z"/>
                                <path d="M7 15h10"/>
                                <path d="M12 15v6"/>
                            </svg>
                        </button>
                    ` : ''}
                    <button class="btn btn-danger rounded-circle p-3 end-call">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" transform="rotate(135, 12, 12)"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;

        // this.bindEvents();
    }

    // private bindEvents(): void {
    //     const toggleAudio = this.container.querySelector<HTMLButtonElement>('.toggle-audio');
    //     const toggleVideo = this.container.querySelector<HTMLButtonElement>('.toggle-video');
    //     const toggleScreenShare = this.container.querySelector<HTMLButtonElement>('.toggle-screen-share');
    //     const endCall = this.container.querySelector<HTMLButtonElement>('.end-call');
    //
    //     toggleAudio?.addEventListener('click', () => this.toggleAudio());
    //     toggleVideo?.addEventListener('click', () => this.toggleVideo());
    //     toggleScreenShare?.addEventListener('click', () => this.toggleScreenShare());
    //     endCall?.addEventListener('click', () => this.endCall());
    // }

    //
    // async startVideoCall(contactId: string): Promise<void> {
    //     try {
    //         this.callManager = new CallManager(contactId);
    //         const localStream = await this.callManager.startCall('video');
    //
    //         const localVideo = this.container.querySelector('#localVideo');
    //         const remoteVideo = this.container.querySelector('#remoteVideo');
    //
    //         localVideo.srcObject = localStream;
    //
    //         this.callManager.onRemoteStream = (stream) => {
    //             remoteVideo.srcObject = stream;
    //         };
    //
    //         this.updateCallStatus('Video call in progress');
    //         this.startTimer();
    //     } catch (error) {
    //         console.error('Error starting video call:', error);
    //         this.updateCallStatus('Failed to start video call');
    //     }
    // }
    //
    // async startVoiceCall(contactId: string): Promise<void> {
    //     try {
    //         this.callManager = new CallManager(contactId);
    //         await this.callManager.startCall('voice');
    //
    //         this.container.querySelector('#localVideo').style.display = 'none';
    //         this.container.querySelector('#remoteVideo').style.display = 'none';
    //
    //         this.updateCallStatus('Voice call in progress');
    //         this.startTimer();
    //     } catch (error) {
    //         console.error('Error starting voice call:', error);
    //         this.updateCallStatus('Failed to start voice call');
    //     }
    // }
    //
    // toggleAudio() {
    //     if (this.callManager?.localStream) {
    //         const audioTrack = this.callManager.localStream.getAudioTracks()[0];
    //         if (audioTrack) {
    //             audioTrack.enabled = !audioTrack.enabled;
    //             this.container.querySelector('.toggle-audio').classList.toggle('btn-danger', !audioTrack.enabled);
    //         }
    //     }
    // }
    //
    // private toggleAudio(): void {
    //     if (this.callManager?.localStream) {
    //         const videoTrack = this.callManager.localStream.getVideoTracks()[0];
    //         if (videoTrack) {
    //             videoTrack.enabled = !videoTrack.enabled;
    //             this.container.querySelector('.toggle-video').classList.toggle('btn-danger', !videoTrack.enabled);
    //         }
    //     }
    // }
    //
    // private toggleVideo(): void {
    //     try {
    //         if (!this.screenStream) {
    //             this.screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
    //             const videoTrack = this.screenStream.getVideoTracks()[0];
    //
    //             const sender = this.callManager.peerConnection
    //                 .getSenders()
    //                 .find(s => s.track?.kind === 'video');
    //
    //             if (sender) {
    //                 await sender.replaceTrack(videoTrack);
    //             }
    //
    //             this.container.querySelector('.toggle-screen-share').classList.add('btn-primary');
    //
    //             videoTrack.onended = () => this.stopScreenShare();
    //         } else {
    //             this.stopScreenShare();
    //         }
    //     } catch (error) {
    //         console.error('Error toggling screen share:', error);
    //     }
    // }
    //
    // private async toggleScreenShare(): Promise<void> { {
    //     if (this.screenStream) {
    //         this.screenStream.getTracks().forEach(track => track.stop());
    //         this.screenStream = null;
    //
    //         if (this.callManager?.localStream) {
    //             const videoTrack = this.callManager.localStream.getVideoTracks()[0];
    //             const sender = this.callManager.peerConnection
    //                 .getSenders()
    //                 .find(s => s.track?.kind === 'video');
    //
    //             if (sender && videoTrack) {
    //                 await sender.replaceTrack(videoTrack);
    //             }
    //         }
    //
    //         this.container.querySelector('.toggle-screen-share').classList.remove('btn-primary');
    //     }
    // }
    //
    // private startTimer(): void {
    //     if (this.options.showTimer) {
    //         this.startTime = Date.now();
    //         this.timerInterval = setInterval(() => {
    //             const elapsed = Date.now() - this.startTime;
    //             const minutes = Math.floor(elapsed / 60000);
    //             const seconds = Math.floor((elapsed % 60000) / 1000);
    //             this.container.querySelector('.call-timer').textContent =
    //                 `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    //         }, 1000);
    //     }
    // }
    //
    // private updateCallStatus(status: string): void {
    //     this.container.querySelector('.call-status').textContent = status;
    // }
    //
    // private async endCall(): Promise<void> {
    //     if (this.callManager) {
    //         await this.callManager.endCall();
    //         if (this.screenStream) {
    //             this.screenStream.getTracks().forEach(track => track.stop());
    //             this.screenStream = null;
    //         }
    //         if (this.timerInterval) {
    //             clearInterval(this.timerInterval);
    //         }
    //         this.container.innerHTML = '';
    //         this.callManager = null;
    //     }
    // }
}