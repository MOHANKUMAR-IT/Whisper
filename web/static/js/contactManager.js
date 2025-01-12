import { Contact } from './contact.js';
import { PeerConnection } from './peerConnection.js';

export class ContactManager {
    constructor(signalingChannel) {
        this.contacts = new Map();
        this.init();
        this.signalingChannel = signalingChannel;
        console.log('Contact manager initialized');
    }

    createPeerConnection(isInitiator, peerId, onMessage) {
        console.log('Creating peer connection for ' + peerId);
        return new PeerConnection(isInitiator, this.signalingChannel, peerId, onMessage);
    }

    addContact(contactId) {
        if (!this.contactListDOM || !contactId || this.contacts.has(contactId)) {
            console.log('Contact already exists or invalid contactId');
            return;
        }

        const contactItem = new Contact(contactId);

        contactItem.contactElement.addEventListener('click', () => {
            this.highlightContact(contactItem.contactElement);
            const peerConnection = this.getConnection(contactId);
            contactItem.renderChatUI(this.chatUIDOM, peerConnection);
        });

        this.contacts.set(contactId, contactItem);
        this.contactListDOM.appendChild(contactItem.contactElement);
    }

    init() {
        this.contactListDOM = document.getElementById('contactList');
        this.searchInputDOM = document.getElementById('contactSearch');
        if (this.searchInputDOM) {
            this.searchInputDOM.addEventListener('input', (e) => {
                this.filterContacts(e.target.value);
            });
        }
        this.chatUIDOM = document.getElementById('chat-area');
    }

    removeContact(contactId) {
        const contactItem = this.contacts.get(contactId);
        if (contactItem) {
            if (contactItem.contactElement && contactItem.contactElement.parentNode === this.contactListDOM) {
                this.contactListDOM.removeChild(contactItem.contactElement);
            }
            this.contacts.delete(contactId);
        } else {
            console.warn(`Contact with ID ${contactId} not found.`);
        }
    }

    highlightContact(contactElement) {
        this.contacts.forEach((contact) => {
            contact.contactElement.classList.remove('selected');
        });
        contactElement.classList.add('selected');
    }

    filterContacts(searchTerm) {
        this.contacts.forEach((contactItem) => {
            const shouldShow = contactItem.contactId.toLowerCase().includes(searchTerm.toLowerCase());
            contactItem.contactElement.style.display = shouldShow ? 'block' : 'none';
        });
    }

    createConnection(peerId) {
        let contact = this.contacts.get(peerId);
        if (!contact) {
            throw new Error('Contact not found');
        }

        if (!contact.peerConnection) {
            contact.peerConnection = this.createPeerConnection(false, peerId, (msg) => {
                console.log('Message received: ' + msg);

                contact.handleReceivedMessage(msg);
            });
        }

        return contact.peerConnection;
    }

    getConnection(peerId) {
        let contact = this.contacts.get(peerId);
        if (!contact) {
            throw new Error('Contact not found');
        }

        if (!contact.peerConnection) {
            contact.peerConnection = this.createPeerConnection(true, peerId, (msg) => {
                console.log('Message received: ' + msg);
                contact.handleReceivedMessage(msg);
            });
        }

        return contact.peerConnection;
    }

    closeConnection(peerId) {
        if (this.contacts.has(peerId)) {
            const contact = this.contacts.get(peerId);
            if (contact.peerConnection) {
                contact.peerConnection.close();
                contact.peerConnection = null;
            }
            this.removeContact(peerId);
        }
    }
}
