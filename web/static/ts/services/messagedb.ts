import { Message, MessageContent, FileMetadata, MessageStatus } from "../model/message";

export class MessageDB {
    private dbName: string;
    private dbVersion: number;
    private storeName: string;
    private db: IDBDatabase | null;

    constructor() {
        this.dbName = `MessageDB`;
        this.dbVersion = 1;
        this.storeName = 'messages';
        this.db = null;
    }

    private async init(): Promise<void> {
        if (this.db) return;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => reject(new Error(`Failed to open database: ${request.error}`));

            request.onsuccess = () => {
                this.db = request.result;
                if (!this.db) {
                    reject(new Error('Failed to open database'));
                    return;
                }
                this.db.onversionchange = () => {
                    if (this.db) {
                        this.db.close();
                    }
                };
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBRequest).result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const store = db.createObjectStore(this.storeName, {
                        keyPath: 'id',
                        autoIncrement: true,
                    });
                    store.createIndex('timestamp', 'timestamp');
                    store.createIndex('senderId', 'senderId');
                    store.createIndex('recipientId', 'recipientId');
                    store.createIndex('status', 'status');
                    store.createIndex('isunread', 'isunread');
                    store.createIndex('threadId', 'threadId');
                }
            };
        });
    }

    public async SaveMessage(message: Message): Promise<number | undefined> {
        await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(this.storeName, 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const data = { ...message };

            const request = store.add(data);

            request.onsuccess = () => resolve(request.result as number);
            request.onerror = () => reject(new Error(`Failed to save message: ${request.error}`));
        });
    }

    public async GetMessages({
                                 limit = 50,
                                 offset = 0,
                                 senderId,
                                 recipientId,
                                 status,
                                 threadId,
                             }: {
        limit?: number;
        offset?: number;
        senderId?: string;
        recipientId?: string;
        status?: MessageStatus;
        threadId?: string;
    } = {}): Promise<Message[]> {
        await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(this.storeName, 'readonly');
            const store = transaction.objectStore(this.storeName);
            let index = store.index('timestamp');
            let range: IDBKeyRange | null = null;

            if (senderId) {
                index = store.index('senderId');
                range = IDBKeyRange.only(senderId);
            } else if (recipientId) {
                index = store.index('recipientId');
                range = IDBKeyRange.only(recipientId);
            } else if (status) {
                index = store.index('status');
                range = IDBKeyRange.only(status);
            } else if (threadId) {
                index = store.index('threadId');
                range = IDBKeyRange.only(threadId);
            }

            const request = index.getAll(range);

            request.onsuccess = () => {
                try {
                    if (!Array.isArray(request.result)) {
                        throw new Error('Expected array of messages');
                    }

                    const messages = request.result
                        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                        .slice(offset, offset + limit) // Handle pagination with offset & limit
                        .map(data => {
                            try {
                                return new Message(
                                    data.message,
                                    data.senderId,
                                    data.recipientId,
                                    data.status,
                                    data.timestamp,
                                    data.isunread,
                                    data.threadId
                                );
                            } catch (error) {
                                console.error('Failed to create Message instance:', error, data);
                                throw error;
                            }
                        });

                    resolve(messages);
                } catch (error) {
                    reject(new Error(`Failed to process messages: ${error instanceof Error ? error.message : 'Unknown error'}`));
                }
            };

            request.onerror = () => reject(new Error(`Database request failed: ${request.error?.message || 'Unknown error'}`));
        });
    }

    public async GetUnreadCount(): Promise<number> {
        await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(this.storeName, 'readonly');
            const store = transaction.objectStore(this.storeName);
            const index = store.index('isunread');

            const request = index.count(IDBKeyRange.only(true));

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(new Error(`Failed to get unread count: ${request.error}`));
        });
    }

    public async MarkAllAsRead(): Promise<void> {
        await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(this.storeName, 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const index = store.index('isunread');

            const request = index.openCursor(IDBKeyRange.only(true));

            request.onsuccess = (event) => {
                const cursor = (event.target as IDBRequest).result;
                if (cursor) {
                    const update = cursor.value;
                    update.isunread = false;
                    cursor.update(update);
                    cursor.continue();
                } else {
                    resolve();
                }
            };

            request.onerror = () => reject(new Error(`Failed to mark messages as read: ${request.error}`));
        });
    }

    public async DeleteOldMessages(daysOld = 30): Promise<void> {
        await this.init();

        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - daysOld);

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(this.storeName, 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const index = store.index('timestamp');

            const request = index.openCursor(IDBKeyRange.upperBound(cutoff.toISOString()));

            request.onsuccess = (event) => {
                const cursor = (event.target as IDBRequest).result;
                if (cursor) {
                    cursor.delete();
                    cursor.continue();
                } else {
                    resolve();
                }
            };

            request.onerror = () => reject(new Error(`Failed to delete old messages: ${request.error}`));
        });
    }
}
