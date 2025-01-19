// ui/UserUI.ts

import {UserModel, UserStatus} from "../model/user";

export class UserUI {
    private user: UserModel;
    private unreadBadge: HTMLElement;
    private unreadCount: number = 0;
    private domElement : HTMLElement|null = null;
    private nameElement: HTMLElement;
    private avatarElement: HTMLElement;
    private statusElement: HTMLElement;

    constructor(user: UserModel) {
        this.user = user;
        this.unreadBadge = document.createElement('span');
        this.nameElement = document.createElement('div');
        this.avatarElement = document.createElement('div');
        this.statusElement = document.createElement('span');
    }

    public RenderDOMToContainer(container: HTMLElement): void {
        this.domElement = this.CreateUserUIElement();
        container.appendChild(this.domElement);
    }

    public CreateUserUIElement(): HTMLElement {
        const contactItem = document.createElement('li');
        contactItem.className = 'contact-item d-flex align-items-center gap-3 p-3 rounded-3 cursor-pointer';

        const avatar = document.createElement('div');
        avatar.className = 'rounded-circle d-flex align-items-center justify-content-center flex-shrink-0';
        avatar.style.width = '40px';
        avatar.style.height = '40px';
        avatar.style.background = 'rgba(255, 255, 255, 0.1)';
        avatar.innerHTML = this.user.avatar ? `<img src="${this.user.avatar}" alt="avatar" />` : `<span class="text-white">${this.user.username[0].toUpperCase()}</span>`;
        this.avatarElement = avatar;

        const info = document.createElement('div');
        info.className = 'flex-grow-1 min-width-0';

        const name = document.createElement('div');
        name.className = 'text-white text-truncate';
        name.textContent = this.user.username;
        this.nameElement = name;

        const lastMessage = document.createElement('small');
        lastMessage.className = 'text-white-50 d-block text-truncate';
        lastMessage.textContent = 'Click to start chatting';

        info.appendChild(name);
        info.appendChild(lastMessage);

        const meta = document.createElement('div');
        meta.className = 'd-flex flex-column align-items-end gap-2';

        const status = document.createElement('span');
        status.className = 'status-indicator';
        status.style.width = '8px';
        status.style.height = '8px';
        status.style.borderRadius = '50%';
        status.style.backgroundColor = this.getStatusColor();
        this.statusElement = status;

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

    public SetUnreadCount(count: number): void {
        this.unreadCount = count;
        this.unreadBadge.style.display = this.unreadCount > 0 ? 'inline' : 'none';
        this.unreadBadge.textContent = this.unreadCount.toString();
    }

    public GetUnreadCount(): number {
        return this.unreadCount;
    }

    public UpdateUsername(newUsername: string): void {
        this.user.username = newUsername;
        if (this.nameElement) {
            this.nameElement.textContent = newUsername;
        }
    }

    public UpdateAvatar(newAvatar: string): void {
        this.user.avatar = newAvatar;
        if (this.avatarElement) {
            this.avatarElement.innerHTML = newAvatar ? `<img src="${newAvatar}" alt="avatar" />` : `<span class="text-white">${this.user.username[0].toUpperCase()}</span>`;
        }
    }

    public UpdateStatus(newStatus: UserStatus): void {
        this.user.status = newStatus;
        if (this.statusElement) {
            this.statusElement.style.backgroundColor = this.getStatusColor();
        }
    }

    private handleContactClick(): void {
        console.log(`Contact clicked: ${this.user.username}`);
    }

    private getStatusColor(): string {
        switch (this.user.status) {
            case UserStatus.Online:
                return '#28a745';
            case UserStatus.Offline:
                return '#6c757d';
            case UserStatus.Busy:
                return '#dc3545';
            case UserStatus.Away:
                return '#ffc107';
            default:
                return '#6c757d';
        }
    }
}
