import {Message, MessageStatus} from "../model/message";

export class MessageRenderer {
    public static RenderMessage(message: Message, username: string): HTMLElement {
        const msgElement = document.createElement('div');
        const isSent = message.senderId === username; // Determine if the message was sent by the user

        msgElement.className = `message p-3 mb-2 rounded-3 ${
            isSent ? 'bg-primary text-white align-self-end' : 'bg-secondary text-white align-self-start'
        }`;

        const userNameElement = document.createElement('span');
        userNameElement.className = 'username d-block font-weight-bold mb-1';
        userNameElement.textContent = isSent ? 'You' : username;
        msgElement.appendChild(userNameElement);

        if (message.message.type === 'text' && message.message.text) {
            const messageTextElement = document.createElement('span');
            messageTextElement.className = 'message-text';
            messageTextElement.textContent = message.message.text;
            msgElement.appendChild(messageTextElement);
        }

        const timestampElement = document.createElement('small');
        timestampElement.className = 'timestamp text-light d-block mt-2';
        timestampElement.textContent = new Date(message.timestamp).toLocaleTimeString();

        if (isSent) {
            const ticksElement = document.createElement('span');
            ticksElement.className = 'ticks ms-2';
            ticksElement.innerHTML = this.getStatusIcon(message.status);
            timestampElement.appendChild(ticksElement);
        }

        msgElement.appendChild(timestampElement);

        return msgElement;
    }

    static getStatusIcon(status: MessageStatus): string {
        switch (status) {
            case MessageStatus.Read:
                return '✔✔'; // Double tick for read
            case MessageStatus.Delivered:
                return '✔'; // Single tick for delivered
            case MessageStatus.Failed:
                return '❌'; // Cross for failed
            default:
                return ''; // Empty for sent
        }
    }
}
