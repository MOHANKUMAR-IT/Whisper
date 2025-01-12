export class ContactMessageDB {
    constructor(contactId) {
        this.dbName = `MessageDB_${contactId}`;
        this.dbVersion = 1;
        this.storeName = 'messages';
        this.db = null;
        this.isInitialized = false; // Added flag to track initialization status
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                this.isInitialized = true; // Set initialized flag
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const store = db.createObjectStore(this.storeName, {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                    store.createIndex('type', 'type', { unique: false });
                    store.createIndex('unread', 'unread', { unique: false });
                }
            };
        });
    }

    async saveMessage(message, type = 'sent') {
        if (!this.isInitialized) {
            // Ensure the database is initialized before saving the message
            await this.init();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);

            const messageObj = {
                message: message.message,  // Ensure it's stored as a string
                type,
                timestamp: new Date().toISOString(),
                unread: type === 'received'
            };

            const request = store.add(messageObj);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getMessages() {
        if (!this.isInitialized) {
            // Ensure the database is initialized before retrieving messages
            await this.init();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);

            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getUnreadCount() {
        if (!this.isInitialized) {
            // Ensure the database is initialized before fetching unread count
            await this.init();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const index = store.index('unread');

            // Use IDBKeyRange.only(true) to fetch messages where 'unread' is true
            const range = IDBKeyRange.only(true);
            const request = index.getAll(range);

            request.onsuccess = () => resolve(request.result.length);
            request.onerror = () => reject(request.error);
        });
    }

    async markAllAsRead() {
        if (!this.isInitialized) {
            // Ensure the database is initialized before marking messages as read
            await this.init();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const index = store.index('unread');

            const request = index.getAll();
            request.onsuccess = () => {
                const unreadMessages = request.result;
                const updatePromises = unreadMessages.map(msg => {
                    return new Promise((resolveUpdate, rejectUpdate) => {
                        const updateRequest = store.put({
                            ...msg,
                            unread: false
                        });
                        updateRequest.onsuccess = resolveUpdate;
                        updateRequest.onerror = rejectUpdate;
                    });
                });
                Promise.all(updatePromises).then(resolve).catch(reject);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async deleteOldMessages(daysOld = 30) {
        if (!this.isInitialized) {
            // Ensure the database is initialized before deleting old messages
            await this.init();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const index = store.index('timestamp');

            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOld);

            const request = index.getAll();
            request.onsuccess = () => {
                const messages = request.result;
                const deletePromises = messages
                    .filter(msg => new Date(msg.timestamp) < cutoffDate)
                    .map(msg => {
                        return new Promise((resolveDelete, rejectDelete) => {
                            const deleteRequest = store.delete(msg.id);
                            deleteRequest.onsuccess = resolveDelete;
                            deleteRequest.onerror = rejectDelete;
                        });
                    });
                Promise.all(deletePromises).then(resolve).catch(reject);
            };
            request.onerror = () => reject(request.error);
        });
    }
}

export class Message {
    constructor(message, type = 'sent', timestamp) {
        this.message = message;
        this.type = type;
        this.timestamp = timestamp || new Date().toISOString();
    }

    getDOMElement(username) {
        const msgElement = document.createElement('div');
        msgElement.className = `message p-3 mb-2 rounded-3 ${
            this.type === 'sent' ? 'bg-primary text-white align-self-end' : 'bg-secondary text-white align-self-start'
        }`;

        const userName = document.createElement('span');
        userName.className = 'username d-block font-weight-bold mb-1';
        userName.textContent = this.type === 'sent' ? 'You' : username;
        msgElement.appendChild(userName);

        const messageText = document.createElement('span');
        messageText.className = 'message-text';
        messageText.textContent = this.message;
        msgElement.appendChild(messageText);

        const timestamp = document.createElement('small');
        timestamp.className = 'timestamp text-light d-block mt-2';
        timestamp.textContent = new Date(this.timestamp).toLocaleTimeString();
        msgElement.appendChild(timestamp);

        return msgElement;
    }



}
