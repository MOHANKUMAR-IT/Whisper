// components/ChatUI.js
class ChatUI {
    constructor(contactId){
        this.contactId = contactId;
    }

    render() {
        const chatContainer = document.createElement('main');
        chatContainer.className = 'chat-area h-100 d-flex flex-column';

        chatContainer.appendChild(new ChatHeader(this.contactId).render());
        chatContainer.appendChild(new ChatLog().render());
        chatContainer.appendChild(new MessageInput(this.handleMessageSubmit.bind(this)).render());

        return chatContainer;
    }

    handleMessageSubmit(e) {
        e.preventDefault();
        // Message handling logic
    }
}

// components/ChatHeader.js
class ChatHeader {
    constructor(contactId) {
        this.contactId = contactId;
    }

    render() {
        const header = document.createElement('header');
        header.className = 'chat-header p-3 d-flex align-items-center justify-content-between';

        header.appendChild(this.createHeaderLeft());
        header.appendChild(this.createHeaderActions());

        return header;
    }

    createHeaderLeft() {
        const headerLeft = document.createElement('div');
        headerLeft.className = 'd-flex align-items-center gap-3';

        headerLeft.appendChild(new UserAvatar(this.contactId).render());
        headerLeft.appendChild(new UserInfo(this.contactId).render());

        return headerLeft;
    }

    createHeaderActions() {
        return new HeaderActions().render();
    }
}

// components/UserAvatar.js
class UserAvatar {
    constructor(contactId) {
        this.contactId = contactId;
    }

    render() {
        const avatar = document.createElement('div');
        avatar.className = 'rounded-circle d-flex align-items-center justify-content-center';
        avatar.style.width = '40px';
        avatar.style.height = '40px';
        avatar.style.background = 'rgba(255, 255, 255, 0.1)';
        avatar.innerHTML = `<span class="text-white">${this.contactId[0].toUpperCase()}</span>`;
        return avatar;
    }
}

// components/UserInfo.js
class UserInfo {
    constructor(contactId) {
        this.contactId = contactId;
    }

    render() {
        const info = document.createElement('div');
        info.className = 'd-flex flex-column';

        const userName = document.createElement('h2');
        userName.className = 'mb-0 fs-5 text-white';
        userName.textContent = this.contactId;

        const status = document.createElement('small');
        status.className = 'text-white-50';
        status.innerHTML = '<span class="text-success">●</span> Online';

        info.appendChild(userName);
        info.appendChild(status);
        return info;
    }
}

// utils/IconBuilder.js
class IconBuilder {
    static createSVGIcon(pathData, options = {}) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        const defaultAttrs = {
            width: '24',
            height: '24',
            viewBox: '0 0 24 24',
            fill: 'none',
            stroke: 'currentColor',
            'stroke-width': '2'
        };

        Object.entries({ ...defaultAttrs, ...options }).forEach(([key, value]) => {
            svg.setAttribute(key, value);
        });

        if (Array.isArray(pathData)) {
            pathData.forEach(data => {
                const element = document.createElementNS('http://www.w3.org/2000/svg', data.type);
                Object.entries(data.attributes).forEach(([key, value]) => {
                    element.setAttribute(key, value);
                });
                svg.appendChild(element);
            });
        } else {
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', pathData);
            svg.appendChild(path);
        }

        return svg;
    }
}

// components/HeaderActions.js
class HeaderActions {
    render() {
        const actions = document.createElement('div');
        actions.className = 'd-flex gap-2';

        actions.appendChild(this.createActionButton('Voice Call', this.getPhoneIcon()));
        actions.appendChild(this.createActionButton('Video Call', this.getVideoIcon()));
        actions.appendChild(this.createActionButton('More Options', this.getMoreIcon()));

        return actions;
    }

    createActionButton(title, icon) {
        const button = document.createElement('button');
        button.className = 'btn btn-link text-white-50 p-1';
        button.title = title;
        button.appendChild(icon);
        return button;
    }

    getPhoneIcon() {
        return IconBuilder.createSVGIcon('M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z');
    }

    getVideoIcon() {
        return IconBuilder.createSVGIcon([
            {
                type: 'path',
                attributes: { d: 'M23 7l-7 5 7 5V7z' }
            },
            {
                type: 'rect',
                attributes: { x: '1', y: '5', width: '15', height: '14', rx: '2', ry: '2' }
            }
        ]);
    }

    getMoreIcon() {
        return IconBuilder.createSVGIcon([
            {
                type: 'circle',
                attributes: { cx: '12', cy: '12', r: '1' }
            },
            {
                type: 'circle',
                attributes: { cx: '19', cy: '12', r: '1' }
            },
            {
                type: 'circle',
                attributes: { cx: '5', cy: '12', r: '1' }
            }
        ]);
    }
}

// components/MessageInput.js
class MessageInput {
    constructor(onSubmit) {
        this.onSubmit = onSubmit;
    }

    render() {
        const container = document.createElement('div');
        container.className = 'message-input-container p-3';

        const form = this.createForm();
        container.appendChild(form);

        return container;
    }

    createForm() {
        const form = document.createElement('form');
        form.className = 'message-form d-flex gap-2';

        form.appendChild(this.createToolButton('attachment'));
        form.appendChild(this.createToolButton('emoji'));
        form.appendChild(this.createTextInput());
        form.appendChild(this.createSendButton());

        form.addEventListener('submit', this.onSubmit);
        return form;
    }

    createToolButton(type) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'btn btn-link text-white-50 p-2';
        button.appendChild(this.getToolIcon(type));
        return button;
    }

    createTextInput() {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'input form-control bg-dark text-white border-0';
        input.placeholder = 'Type your message...';
        return input;
    }

    createSendButton() {
        const button = document.createElement('button');
        button.type = 'submit';
        button.className = 'btn btn-primary d-flex align-items-center justify-content-center';
        button.appendChild(this.getSendIcon());
        return button;
    }

    getToolIcon(type) {
        const icons = {
            attachment: 'M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48',
            emoji: [
                { type: 'circle', attributes: { cx: '12', cy: '12', r: '10' } },
                { type: 'path', attributes: { d: 'M8 14s1.5 2 4 2 4-2 4-2' } },
                { type: 'line', attributes: { x1: '9', y1: '9', x2: '9.01', y2: '9' } },
                { type: 'line', attributes: { x1: '15', y1: '9', x2: '15.01', y2: '9' } }
            ]
        };
        return IconBuilder.createSVGIcon(icons[type], { width: '20', height: '20' });
    }

    getSendIcon() {
        return IconBuilder.createSVGIcon([
            { type: 'line', attributes: { x1: '22', y1: '2', x2: '11', y2: '13' } },
            { type: 'polygon', attributes: { points: '22 2 15 22 11 13 2 9 22 2' } }
        ], { width: '20', height: '20' });
    }
}

// components/ChatLog.js
class ChatLog {
    constructor() {
        this.container = null;
    }

    render() {
        this.container = document.createElement('div');
        this.container.className = 'chat-log-container flex-grow-1 p-3 overflow-auto';
        return this.container;
    }

    addMessage(message) {
        this.container.appendChild(message.render());
        this.container.scrollTop = this.container.scrollHeight;
    }

    clear() {
        while (this.container.firstChild) {
            this.container.firstChild.remove();
        }
    }
}


class CallManager {
    constructor() {
        this.peerConnection = null;
        this.localStream = null;
        this.remoteStream = null;
        this.isInCall = false;
    }

    async startCall(isVideo = false) {
        try {
            this.localStream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: isVideo
            });

            this.peerConnection = new RTCPeerConnection({
                iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
            });

            this.localStream.getTracks().forEach(track => {
                this.peerConnection.addTrack(track, this.localStream);
            });

            this.isInCall = true;
            return this.localStream;
        } catch (error) {
            console.error('Error starting call:', error);
            throw error;
        }
    }

    async endCall() {
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
        }
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }
        this.isInCall = false;
    }
}