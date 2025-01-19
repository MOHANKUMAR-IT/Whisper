export class ChatHeader {

    private contactId: string;
    private onVoiceCall: ()=>void;
    private onVideoCall: ()=>void;
    private onMoreOptions: ()=>void;

    constructor(contactId: string, onVoiceCall: ()=>void, onVideoCall : ()=>void, onMoreOptions: ()=>void ) {
        this.contactId = contactId; // User's contact ID or name
        this.onVoiceCall = onVoiceCall; // Callback for voice call button
        this.onVideoCall = onVideoCall; // Callback for video call button
        this.onMoreOptions = onMoreOptions; // Callback for more options button
    }

    public CreateHeaderElement() : HTMLElement {
        const chatHeader = document.createElement('header');
        chatHeader.className = 'chat-header p-3 d-flex align-items-center justify-content-between';

        // Left section with avatar and contact info
        const headerLeft = document.createElement('div');
        headerLeft.className = 'd-flex align-items-center gap-3';

        const avatar = document.createElement('div');
        avatar.className = 'rounded-circle d-flex align-items-center justify-content-center';
        avatar.style.width = '40px';
        avatar.style.height = '40px';
        avatar.style.background = 'rgba(255, 255, 255, 0.1)';
        avatar.innerHTML = `<span class="text-white">${this.contactId[0].toUpperCase()}</span>`;

        const headerInfo = document.createElement('div');
        headerInfo.className = 'd-flex flex-column';

        const userNameHeading = document.createElement('h2');
        userNameHeading.className = 'mb-0 fs-5 text-white';
        userNameHeading.textContent = this.contactId;

        const statusText = document.createElement('small');
        statusText.className = 'text-white-50';
        statusText.innerHTML = '<span class="text-success">●</span> Online';

        headerInfo.appendChild(userNameHeading);
        headerInfo.appendChild(statusText);
        headerLeft.appendChild(avatar);
        headerLeft.appendChild(headerInfo);

        // Right section with action buttons
        const headerActions = document.createElement('div');
        headerActions.className = 'd-flex gap-2';

        // Voice call button
        const voiceCallButton = this.createActionButton('Voice Call', this.onVoiceCall, `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>
        `);

        // Video call button
        const videoCallButton = this.createActionButton('Video Call', this.onVideoCall, `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M23 7l-7 5 7 5V7z"></path>
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
            </svg>
        `);

        // More options button
        const moreOptionsButton = this.createActionButton('More Options', this.onMoreOptions, `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="1"></circle>
                <circle cx="19" cy="12" r="1"></circle>
                <circle cx="5" cy="12" r="1"></circle>
            </svg>
        `);

        headerActions.appendChild(voiceCallButton);
        headerActions.appendChild(videoCallButton);
        headerActions.appendChild(moreOptionsButton);

        chatHeader.appendChild(headerLeft);
        chatHeader.appendChild(headerActions);

        return chatHeader;
    }

    createActionButton(title: string, callback: () => void, svgContent :string) {
        const button = document.createElement('button');
        button.className = 'btn btn-link text-white-50 p-1';
        button.title = title;
        button.innerHTML = svgContent;
        if (callback) button.addEventListener('click', callback);
        return button;
    }
}