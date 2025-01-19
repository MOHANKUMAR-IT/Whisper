import { MessageDB } from './services/messagedb';
import {ChatUI} from "./ui/chatui";
import {UserUI} from "./ui/userui";
import {UserModel} from "./model/user";
import {Message} from "./model/message";
import {PeerConnection} from "./services/peerconnection";

class Contact {
    private contactId: string;
    private chatUI: ChatUI;
    private peerConnection: PeerConnection | null;
    private messageDB: MessageDB;
    private user: UserModel;
    private userUI : UserUI;
    private userUIDOM : HTMLElement;
    private localStream: MediaStream | null;

    constructor(user : UserModel,db : MessageDB) {
        this.contactId = user.id;
        this.user = user;
        this.chatUI = new ChatUI(user.id,this.handleMessageSubmit);
        this.userUI = new UserUI(user);
        this.userUIDOM = this.userUI.CreateUserUIElement();
        this.peerConnection = null;
        this.messageDB = db;
        this.localStream = null;
    }

    public CloseConnection() {
        if (this.peerConnection) {
            this.peerConnection.Close();
            this.peerConnection = null;
        }
    }

    public GetContactId(): string {
        return this.contactId;
    }

    public GetUserDOMElement(): HTMLElement  {
        return this.userUIDOM;
    }

    public IsConnectionOpen(): boolean {
        return this.peerConnection !== null && this.peerConnection.isReady();
    }

    public SetPeerConnection(peerConnection: PeerConnection) {
        this.peerConnection = peerConnection;
    }

    public GetPeerConnection(): PeerConnection | null {
        return this.peerConnection;
    }

    async handleContactClick() {
        await this.messageDB.MarkAllAsRead();
        await this.updateUnreadBadge();
        console.log(`Contact ${this.contactId} clicked`);
    }

    async updateUnreadBadge() {
        const unreadCount = await this.messageDB.GetUnreadCount();
        this.userUI.SetUnreadCount(unreadCount);
    }

    async saveMessage(message : Message) {
        await this.messageDB.SaveMessage(message);
    }

    async loadMessages() {
        try {
            return await this.messageDB.GetMessages();
        } catch (error) {
            console.error('Error loading messages:', error);
            return [];
        }
    }

    async handleMessageSubmit(message : Message) {
        if (this.peerConnection) {
            await this.saveMessage(message);
            await this.peerConnection.sendMessage(JSON.stringify(message));
        } else {
            throw new Error('No peer connection available');
        }
    }

    async renderMessages() {
        try {
            const messages = await this.loadMessages();

            this.chatUI.ResetChatLogContainer()

            this.chatUI.AddMessagesToChatLog(messages);

        } catch (error) {
            console.error('Error rendering messages:', error);
        }
    }


    async handleReceivedMessage(message: Message) {
        try {
            message.isunread = true;
            await this.saveMessage(message);
            this.userUI.SetUnreadCount(this.userUI.GetUnreadCount() + 1);
            this.chatUI.AddMessagesToChatLog([message]);
        } catch (error) {
            console.error('Error handling received message:', error);
        }
    }


    renderChatUI(containerElement: HTMLElement ) {

        containerElement.innerHTML = '';
        containerElement.appendChild(this.chatUI.GetChatUIElement());

        this.renderMessages().then(() => {
            console.log('Chat UI rendered for', this.contactId);
        }).catch((error) => {
            console.error('Error rendering chat messages:', error);
        });
    }

}

export { Contact };
