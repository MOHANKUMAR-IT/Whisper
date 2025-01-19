import {Contact} from '../contact';
import {PeerConnection} from './peerconnection';
import {SignalingChannel} from './signaling';
import {UserModel, UserStatus} from "../model/user";
import {UserUI} from "../ui/userui";
import {MessageDB} from "./messagedb";
import {Message} from "../model/message";

export class Usermanager {

    private signalingChannel: SignalingChannel;
    private contacts: Map<string, Contact>;
    private contactListDOM: HTMLElement | null = null;
    private searchInputDOM: HTMLInputElement | null = null;
    private chatUIDOM: HTMLElement | null = null;
    private messageDB : MessageDB;

    constructor(signalingChannel: SignalingChannel) {
        this.contacts = new Map();
        this.signalingChannel = signalingChannel;

        this.contactListDOM = document.getElementById('contactList');
        if (!this.contactListDOM) {
            throw new Error('Contact list element not found');
        }

        this.searchInputDOM = document.getElementById('contactSearch') as HTMLInputElement;
        if (this.searchInputDOM) {
            this.searchInputDOM.addEventListener('input', (e) => {
                const target = e.target as HTMLInputElement;
                this.filterContacts(target.value);
            });
        }

        this.chatUIDOM = document.getElementById('chat-area');
        if (!this.chatUIDOM) {
            throw new Error('Chat UI element not found');
        }

        this.messageDB = new MessageDB();

    }

    public CreatePeerConnection(
        isInitiator: boolean,
        peerId: string,
        onMessage: (msg: Message) => void
    ): PeerConnection {
        return new PeerConnection(isInitiator, this.signalingChannel, peerId, onMessage, (stream) => {});
    }

    public AddContact(contactId: string,nicname: string): void {
        if (!contactId || this.contacts.has(contactId)) {
            console.log('Contact already exists or invalid contactId');
            return;
        }
        const user = new UserModel(contactId,nicname,UserStatus.Online, new Date());
        const contact = new Contact(user,this.messageDB);
        const userUIDOM = contact.GetUserDOMElement()

        userUIDOM.addEventListener('click', () => {
            this.highlightContact(userUIDOM);
            const contact = this.contacts.get(contactId);
            if (!contact) {
                throw new Error('Contact not found');
            }
            this.setConnectionForContact(contact);

            if (this.chatUIDOM)
            contact.renderChatUI(this.chatUIDOM);
        });

        this.contacts.set(contactId, contact);

        if (this.contactListDOM)
        this.contactListDOM.appendChild(userUIDOM);
        else throw new Error('Contact list DOM element not found');
    }

    public RemoveContact(contactId: string): void {
        const contactItem = this.contacts.get(contactId);
        if (!contactItem) {
            console.warn(`Contact with ID ${contactId} not found.`);
            return;
        }
        if (!this.contactListDOM) {
            throw new Error('Contact list DOM element not found');
        }
        const userDOM = contactItem.GetUserDOMElement()
        if ( userDOM&& userDOM.parentNode === this.contactListDOM) {
            this.contactListDOM.removeChild(userDOM);
        }

        if (this.chatUIDOM?.firstElementChild?.id === 'chat-area_' + contactId) {
            this.chatUIDOM.innerHTML = '';
        }

        contactItem.CloseConnection()

        this.contacts.delete(contactId);
    }

    private highlightContact(contactElement: HTMLElement): void {
        this.contacts.forEach((contact) => {
            contact.GetUserDOMElement().classList.remove('selected');
        });
        contactElement.classList.add('selected');
    }

    private filterContacts(searchTerm: string): void {
        this.contacts.forEach((contactItem:Contact) => {
            const shouldShow = contactItem.GetContactId().toLowerCase().includes(searchTerm.toLowerCase());
            contactItem.GetUserDOMElement().style.display = shouldShow ? 'block' : 'none';
        });
    }

    private setConnectionForContact(contact : Contact): void {

        if (!contact.IsConnectionOpen()) {
            const peerConnection = this.CreatePeerConnection(true, contact.GetContactId(), (msg) => {
                console.log('Message received: ' + msg);
                contact.handleReceivedMessage(msg);
            });
            contact.SetPeerConnection(peerConnection);
        }
    }

    public GetConnection(contactId: string): PeerConnection | null{
        const contact = this.contacts.get(contactId);
        if (!contact) {
            throw new Error('Contact not found');
        }
        this.setConnectionForContact(contact);
        return contact.GetPeerConnection();
    }

}
