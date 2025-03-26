export class Message {
    name: string;
    photo: string;
    content: string;
    time: Date;
    from: string;
    to: string;
    thread: any[] = [];
    reactions: any[] = [];

    constructor(username: string, photo: string, content: string, from: string, to: string) {
        this.name = username;
        this.photo = photo;
        this.content = content;
        this.time = new Date();
        this.from = from;
        this.to = to;

    }
}