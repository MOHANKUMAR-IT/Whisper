import { ContactMessageDB, Message } from './messageDB.js';

class Contact {
    constructor(contactId) {
        this.contactId = contactId;
        this.chatUIElement = this.createChatUIElement();
        this.contactElement = this.createContactElement();
        this.peerConnection = null;
        this.unreadBadge = null;
        this.messageDB = new ContactMessageDB(contactId);
        console.log(`Contact ${contactId} initialized`);
    }

    createChatUIElement() {
        const chatContainer = document.createElement('main');
        chatContainer.className = 'chat-area h-100 d-flex flex-column';

        // Create header with more info
        const chatHeader = document.createElement('header');
        chatHeader.className = 'chat-header p-3 d-flex align-items-center justify-content-between';

        const headerLeft = document.createElement('div');
        headerLeft.className = 'd-flex align-items-center gap-3';

        // Avatar placeholder
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

        // Header actions
        const headerActions = document.createElement('div');
        headerActions.className = 'd-flex gap-2';

        const voiceCallButton = document.createElement('button');
        voiceCallButton.className = 'btn btn-link text-white-50 p-1';
        voiceCallButton.title = 'Voice Call';

        const voiceCallSVG = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        voiceCallSVG.setAttribute('width', '24');
        voiceCallSVG.setAttribute('height', '24');
        voiceCallSVG.setAttribute('viewBox', '0 0 24 24');
        voiceCallSVG.setAttribute('fill', 'none');
        voiceCallSVG.setAttribute('stroke', 'currentColor');
        voiceCallSVG.setAttribute('stroke-width', '2');

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z');

        voiceCallSVG.appendChild(path);
        voiceCallButton.appendChild(voiceCallSVG);

        headerActions.appendChild(voiceCallButton);

        const videoCallButton = document.createElement('button');
        videoCallButton.className = 'btn btn-link text-white-50 p-1';
        videoCallButton.title = 'Video Call';

        const videoCallSVG = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        videoCallSVG.setAttribute('width', '24');
        videoCallSVG.setAttribute('height', '24');
        videoCallSVG.setAttribute('viewBox', '0 0 24 24');
        videoCallSVG.setAttribute('fill', 'none');
        videoCallSVG.setAttribute('stroke', 'currentColor');
        videoCallSVG.setAttribute('stroke-width', '2');

// Create the <path> element for the triangle (play icon)
        const videoCallPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        videoCallPath.setAttribute('d', 'M23 7l-7 5 7 5V7z');
        videoCallSVG.appendChild(videoCallPath);

// Create the <rect> element for the video screen
        const videoCallRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        videoCallRect.setAttribute('x', '1');
        videoCallRect.setAttribute('y', '5');
        videoCallRect.setAttribute('width', '15');
        videoCallRect.setAttribute('height', '14');
        videoCallRect.setAttribute('rx', '2');
        videoCallRect.setAttribute('ry', '2');
        videoCallSVG.appendChild(videoCallRect);

        videoCallButton.appendChild(videoCallSVG);

        headerActions.appendChild(videoCallButton);

        const moreOptionsButton = document.createElement('button');
        moreOptionsButton.className = 'btn btn-link text-white-50 p-1';
        moreOptionsButton.title = 'More Options';

        const moreOptionsSVG = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        moreOptionsSVG.setAttribute('width', '24');
        moreOptionsSVG.setAttribute('height', '24');
        moreOptionsSVG.setAttribute('viewBox', '0 0 24 24');
        moreOptionsSVG.setAttribute('fill', 'none');
        moreOptionsSVG.setAttribute('stroke', 'currentColor');
        moreOptionsSVG.setAttribute('stroke-width', '2');

// Create the <circle> elements for the three dots
        const circle1 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle1.setAttribute('cx', '12');
        circle1.setAttribute('cy', '12');
        circle1.setAttribute('r', '1');
        moreOptionsSVG.appendChild(circle1);

        const circle2 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle2.setAttribute('cx', '19');
        circle2.setAttribute('cy', '12');
        circle2.setAttribute('r', '1');
        moreOptionsSVG.appendChild(circle2);

        const circle3 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle3.setAttribute('cx', '5');
        circle3.setAttribute('cy', '12');
        circle3.setAttribute('r', '1');
        moreOptionsSVG.appendChild(circle3);

        moreOptionsButton.appendChild(moreOptionsSVG);

        headerActions.appendChild(moreOptionsButton);

        chatHeader.appendChild(headerLeft);
        chatHeader.appendChild(headerActions);

        // Chat log container
        const chatLogContainer = document.createElement('div');
        chatLogContainer.className = 'chat-log-container flex-grow-1 p-3 overflow-auto';

        // Message input area
        const messageInputContainer = document.createElement('div');
        messageInputContainer.className = 'message-input-container p-3';

        const form = document.createElement('form');
        form.className = 'message-form d-flex gap-2';

        // Add attachment and emoji buttons
        const attachmentButton = document.createElement('button');
        attachmentButton.type = 'button';
        attachmentButton.className = 'btn btn-link text-white-50 p-2';
        attachmentButton.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
            </svg>
        `;

        const emojiButton = document.createElement('button');
        emojiButton.type = 'button';
        emojiButton.className = 'btn btn-link text-white-50 p-2';
        emojiButton.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                <line x1="9" y1="9" x2="9.01" y2="9"/>
                <line x1="15" y1="9" x2="15.01" y2="9"/>
            </svg>
        `;

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'input form-control bg-dark text-white border-0';
        input.placeholder = 'Type your message...';

        const sendButton = document.createElement('button');
        sendButton.type = 'submit';
        sendButton.className = 'btn btn-primary d-flex align-items-center justify-content-center';
        sendButton.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
        `;

        form.appendChild(attachmentButton);
        form.appendChild(emojiButton);
        form.appendChild(input);
        form.appendChild(sendButton);
        messageInputContainer.appendChild(form);

        chatContainer.appendChild(chatHeader);
        chatContainer.appendChild(chatLogContainer);
        chatContainer.appendChild(messageInputContainer);

        form.addEventListener('submit', (e) => this.handleMessageSubmit(e));

        return chatContainer;
    }

    createContactElement() {
        const contactItem = document.createElement('li');
        contactItem.className = 'contact-item d-flex align-items-center gap-3 p-3 rounded-3 cursor-pointer';

        // Avatar
        const avatar = document.createElement('div');
        avatar.className = 'rounded-circle d-flex align-items-center justify-content-center flex-shrink-0';
        avatar.style.width = '40px';
        avatar.style.height = '40px';
        avatar.style.background = 'rgba(255, 255, 255, 0.1)';
        avatar.innerHTML = `<span class="text-white">${this.contactId[0].toUpperCase()}</span>`;

        // Contact info
        const info = document.createElement('div');
        info.className = 'flex-grow-1 min-width-0';

        const name = document.createElement('div');
        name.className = 'text-white text-truncate';
        name.textContent = this.contactId;

        const lastMessage = document.createElement('small');
        lastMessage.className = 'text-white-50 d-block text-truncate';
        lastMessage.textContent = 'Click to start chatting';

        info.appendChild(name);
        info.appendChild(lastMessage);

        // Status and badge wrapper
        const meta = document.createElement('div');
        meta.className = 'd-flex flex-column align-items-end gap-2';

        const status = document.createElement('span');
        status.className = 'status-indicator';
        status.style.width = '8px';
        status.style.height = '8px';
        status.style.borderRadius = '50%';
        status.style.backgroundColor = '#28a745';

        this.unreadBadge = document.createElement('span');
        this.unreadBadge.className = 'badge bg-primary rounded-pill';
        this.unreadBadge.style.display = 'none';

        meta.appendChild(status);
        meta.appendChild(this.unreadBadge);

        contactItem.appendChild(avatar);
        contactItem.appendChild(info);
        contactItem.appendChild(meta);

        contactItem.addEventListener('click', () => this.handleContactClick());
        contactItem.addEventListener('mouseenter', () => contactItem.style.background = 'rgba(255, 255, 255, 0.1)');
        contactItem.addEventListener('mouseleave', () => contactItem.style.background = 'transparent');

        return contactItem;
    }

    async handleContactClick() {
        await this.messageDB.markAllAsRead();
        await this.updateUnreadBadge();
        console.log(`Contact ${this.contactId} clicked`);
    }

    async updateUnreadBadge() {
        const unreadCount = await this.messageDB.getUnreadCount();
        this.unreadBadge.textContent = unreadCount > 0 ? unreadCount : '';
        this.unreadBadge.style.display = unreadCount > 0 ? 'block' : 'none';
    }

    async saveMessage(message) {
        await this.messageDB.saveMessage(message, message.type);
        console.log('Message saved:', message);
    }

    async loadMessages() {
        try {
            const messagesData = await this.messageDB.getMessages();
            return messagesData.map(msgData => new Message(msgData.message, msgData.type, msgData.timestamp));
        } catch (error) {
            console.error('Error loading messages:', error);
            return [];
        }
    }


    async handleMessageSubmit(event) {
        event.preventDefault();

        const inputField = this.chatUIElement.querySelector('.input');
        const messageText = inputField.value.trim();

        if (messageText) {
            await this.sendMessage(messageText);
            inputField.value = ''; // Clear the input field
        } else {
            console.log('Message is empty');
        }
    }

    async renderMessages() {
        try {
            const messages = await this.loadMessages();
            const chatLogContainer = this.chatUIElement?.querySelector('.chat-log-container'); // Optional chaining
            if (!chatLogContainer) {
                console.error('Chat log container not found');
                return;
            }
            chatLogContainer.innerHTML = ''; // Clear old messages
            messages.forEach((msg) => {
                const messageElement = msg.getDOMElement(this.contactId);
                if (messageElement) {
                    chatLogContainer.appendChild(messageElement);
                }
            });
        } catch (error) {
            console.error('Error rendering messages:', error);
        }
    }

    async sendMessage(messageText) {
        try {
            if (this.peerConnection) {
                await this.peerConnection.sendMessage(messageText);
                const msg = new Message(messageText, 'sent');
                await this.saveMessage(msg);

                const chatLogContainer = this.chatUIElement?.querySelector('.chat-log-container');
                if (chatLogContainer) {
                    chatLogContainer.appendChild(msg.getDOMElement());
                    this.scrollToBottom();
                } else {
                    console.error('Chat log container not found');
                }
            } else {
                throw new Error('No peer connection available');
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    }

    scrollToBottom() {
        const chatLogContainer = this.chatUIElement?.querySelector('.chat-log-container');
        if (chatLogContainer) {
            chatLogContainer.scrollTop = chatLogContainer.scrollHeight;
        }
    }

    async handleReceivedMessage(message) {
        try {
            const msg = new Message(message, 'received');
            await this.saveMessage(msg);

            const chatLogContainer = this.chatUIElement?.querySelector('.chat-log-container');
            if (chatLogContainer) {
                chatLogContainer.appendChild(msg.getDOMElement(this.contactId));
            } else {
                console.error('Chat log container not found');
            }
        } catch (error) {
            console.error('Error handling received message:', error);
        }
    }


    renderChatUI(containerElement, peerConnection) {
        this.peerConnection = peerConnection;

        // Clear the container element and append the chat UI element
        containerElement.innerHTML = ''; // Clear existing content
        containerElement.appendChild(this.chatUIElement); // Append the chat UI

        // Render the messages asynchronously
        this.renderMessages().then(() => {
            console.log('Chat UI rendered for', this.contactId);
        }).catch((error) => {
            console.error('Error rendering chat messages:', error);
        });
    }

}

export { Contact };
