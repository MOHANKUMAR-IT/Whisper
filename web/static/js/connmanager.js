import { PeerConnection } from './peerconnection.js';

export class ConnectionManager {
    constructor() {
        this.connections = new Map();
        this.connectionTimeout = 60000;
        this.cleanupInterval = setInterval(() => this.cleanupConnections(), 30000);
    }

    getConnection(peerId, signalingChannel, onReceivedMessage) {
        let connection = this.connections.get(peerId);
        if (!connection && signalingChannel && onReceivedMessage) {
            connection = new PeerConnection(true, signalingChannel, peerId, onReceivedMessage);
            this.connections.set(peerId, connection);
        }
        return connection;
    }

    // Close an existing connection
    closeConnection(peerId) {
        if (this.connections.has(peerId)) {
            const connection = this.connections.get(peerId);
            connection.close();
            this.connections.delete(peerId);
        }
    }

    // Periodically cleanup idle connections
    cleanupConnections() {
        setInterval(() => {
            const currentTime = Date.now();
            this.connections.forEach((connection, peerId) => {
                if (currentTime - connection.lastActivityTime > this.connectionTimeout) {
                    console.log(`Closing idle connection with ${peerId}`);
                    this.closeConnection(peerId);
                }
            });
        }, 30000); // Check every 30 seconds
    }

    // Mark connection as active (when message is received or sent)
    markConnectionActive(peerId) {
        if (this.connections.has(peerId)) {
            this.connections.get(peerId).lastActivityTime = Date.now();
        }
    }
}
