export class User {
    name: string;
    email: string;
    password: string;
    avatar: string;
    messages: string[];
    online: boolean;
    login: string;

    constructor(user?: any) {
        this.name = user ? user.name : '';
        this.email = user ? user.email : '';
        this.password = user ? user.password : '';
        this.avatar = user ? user.avatar : '';
        this.messages = user ? user.messages : [];
        this.online = user ? user.online : false;
        this.login = user ? user.login : '';
    }
}
