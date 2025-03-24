export class Channel {
    name: string;
    description: string;
    messages: any[];  // Nachrichten-Array
    creator: any;
    creatorID:string;
    timestamp: string;
    members: any[];
  
    // Konstruktor mit initialisiertem messages-Array
    constructor(
      name: string = '',
      description: string = '',
      creator: any = null,
      id:string='',
      members: any[] = [],
      messages: any[] = [],  // Hier initialisieren wir das messages-Array
      timestamp: string = new Date().toISOString()
    ) {
      this.name = name;
      this.description = description;
      this.creator = creator;
      this.creatorID=id;
      this.members = members;
      this.messages = messages;  // Nachrichten-Array zuweisen
      this.timestamp = timestamp;
    }
  }