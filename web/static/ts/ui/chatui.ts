import {Message, MessageContent, MessageStatus, MessageType} from "../model/message";
import {MessageRenderer} from "./messageui";
import {MessageDB} from "../services/messagedb";

export class ChatUI {
    private contactId: string;
    private OnMessage: (msg: Message) => void;
    private chatContainer: HTMLElement;

    constructor(contactId: string, onMessage: (msg: Message) => void) {
        this.contactId = contactId;
        this.OnMessage = onMessage;
        this.chatContainer  = document.createElement('div');

    }

    public GetChatUIElement(): HTMLElement {
        if (!this.chatContainer) {
            this.renderUIElement();
        }
        return this.chatContainer;
    }

    private renderUIElement(): void {
        this.chatContainer.className = 'chat-area h-100 d-flex flex-column';
        this.chatContainer.id = 'chat-area_' + this.contactId;

        const chatLogContainer = document.createElement('div');
        chatLogContainer.className = 'chat-log-container flex-grow-1 p-3 overflow-auto';

        const messageInputContainer = document.createElement('div');
        messageInputContainer.className = 'message-input-container p-3';

        const form = document.createElement('form');
        form.className = 'message-form d-flex gap-2';

        // Attachment input for media and files
        const attachmentInput = document.createElement('input');
        attachmentInput.type = 'file';
        attachmentInput.className = 'd-none';
        attachmentInput.accept = 'image/*,video/*,application/pdf';
        attachmentInput.id = `attachment-input-${this.contactId}`;

        const attachmentButton = document.createElement('button');
        attachmentButton.type = 'button';
        attachmentButton.className = 'btn btn-link text-white-50 p-2';
        attachmentButton.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
        </svg>
    `;
        attachmentButton.addEventListener('click', () => attachmentInput.click());

        const emojiButton = document.createElement('button');
        emojiButton.type = 'button';
        emojiButton.className = 'btn btn-link text-white-50 p-2';
        emojiButton.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
            <line x1="9" y1="9" x2="9.01" y2="9"></line>
            <line x1="15" y1="9" x2="15.01" y2="9"></line>
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
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
        </svg>
    `;

        form.appendChild(attachmentInput);
        form.appendChild(attachmentButton);
        form.appendChild(emojiButton);
        form.appendChild(input);
        form.appendChild(sendButton);
        messageInputContainer.appendChild(form);

        this.chatContainer.appendChild(chatLogContainer);
        this.chatContainer.appendChild(messageInputContainer);

        form.addEventListener('submit', (e) => this.handleTextMessageSubmit(e, input));
        attachmentInput.addEventListener('change', (e) => this.handleMediaMessageSubmit(e, attachmentInput));
    }

    private handleTextMessageSubmit(e: Event, input: HTMLInputElement): void {
        e.preventDefault();

        const text = input.value.trim();
        if (!text) {
            return; // Do nothing if the input is empty
        }

        const content: MessageContent = {
            type: MessageType.Text,
            text: text,
        };

        const message = new Message(
            content,
            "self",
            this.contactId,
            MessageStatus.Sent
        );

        this.OnMessage(message);
        this.AddMessagesToChatLog([message]);
        input.value = '';
    }


    private handleMediaMessageSubmit(e: Event, attachmentInput: HTMLInputElement): void {
        const file = attachmentInput.files?.[0];
        if (!file) {
            return;
        }

        const content: MessageContent = {
            type: MessageType.Media,
            mediaUrl: URL.createObjectURL(file),
            fileMetadata: {
                filename: file.name,
                size: file.size,
                mimeType: file.type,
            },
        };

        const message = new Message(
            content,
            "self",
            this.contactId,
            MessageStatus.Sent
        );

        this.OnMessage(message);
        this.AddMessagesToChatLog([message]);
        attachmentInput.value = '';
    }

    public ResetChatLogContainer(): void {
        const chatLogContainer = document.getElementById('chat-area_' + this.contactId);
        if (chatLogContainer) {
            chatLogContainer.innerHTML = '';
        }else{
            console.error('Chat log container not found');
        }
    }

    public AddMessagesToChatLog(messages : Message[]): void {
        const chatLogContainer = document.getElementById('chat-area_' + this.contactId);
        if (!chatLogContainer) {
            console.error('Chat log container not found');
            return;
        }


        messages.forEach((msg) => {
            const msgElement = MessageRenderer.RenderMessage(msg, this.contactId);
            chatLogContainer.appendChild(msgElement);
        });

        chatLogContainer.scrollTop = chatLogContainer.scrollHeight;

    }


}
