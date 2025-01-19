export class Message {
    message: MessageContent;
    senderId: string;
    recipientId: string | null; // null for group messages
    status: MessageStatus;
    timestamp: string;
    isunread: boolean;
    threadId: string;
    id : string;

    constructor(
        message: MessageContent,
        senderId: string,
        recipientId: string | null = null,
        status: MessageStatus = MessageStatus.Sent,
        timestamp: string | null = null,
        isunread: boolean = false,
        threadId: string = "",
    ) {
        this.message = this.sanitizeMessageContent(message);
        this.senderId = senderId;
        this.recipientId = recipientId;
        this.status = status;
        this.timestamp = timestamp || new Date().toISOString();
        this.isunread = isunread;
        this.threadId = threadId;
        this.id = this.generateUUID();
    }

    private generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    private sanitizeMessageContent(content: MessageContent): MessageContent {
        if (content.type === 'text' && content.text) {
            return {
                ...content,
                text: this.escapeHtml(content.text.trim()),
            };
        }
        return content;
    }

    private escapeHtml(unsafe: string): string {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}


export interface MessageContent {
    type: MessageType;
    text?: string;
    mediaUrl?: string;
    fileMetadata?: FileMetadata;
}

export enum MessageType {
    Text = 'text',
    Media = 'media',
    File = 'file',
}

export interface FileMetadata {
    filename: string;
    size: number;
    mimeType: string;
}

export enum MessageStatus {
    Sent = 'Sent',
    Delivered = 'Delivered',
    Read = 'Read',
    Failed = 'Failed',
}
