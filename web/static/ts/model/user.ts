// models/User.ts

export interface User {
    id: string;
    username: string;
    avatar?: string;
    status: UserStatus;
    lastSeen: Date;
}

export enum UserStatus {
    Online = 'Online',
    Offline = 'Offline',
    Busy = 'Busy',
    Away = 'Away',
}

export class UserModel implements User {
    id: string;
    username: string;
    avatar?: string;
    status: UserStatus;
    lastSeen: Date;

    constructor(id: string, username: string, status: UserStatus, lastSeen: Date, avatar?: string) {
        this.id = id;
        this.username = username;
        this.status = status;
        this.lastSeen = lastSeen;
        this.avatar = avatar;
    }

    public setStatus(status: UserStatus): void {
        this.status = status;
    }

    public setLastSeen(date: Date): void {
        this.lastSeen = date;
    }

    public setAvatar(avatarUrl: string): void {
        this.avatar = avatarUrl;
    }
}
