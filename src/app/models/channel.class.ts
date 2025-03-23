export class Channel {
    name: string;
    description: string;
    messages: any[];  // Nachrichten-Array
    creator: any;
    timestamp: string;
    members: any[];
  
    // Konstruktor mit initialisiertem messages-Array
    constructor(
      name: string = '',
      description: string = '',
      creator: any = null,
      members: any[] = [],
      messages: any[] = [],  // Hier initialisieren wir das messages-Array
      timestamp: string = new Date().toISOString()
    ) {
      this.name = name;
      this.description = description;
      this.creator = creator;
      this.members = members;
      this.messages = messages;  // Nachrichten-Array zuweisen
      this.timestamp = timestamp;
    }
  }