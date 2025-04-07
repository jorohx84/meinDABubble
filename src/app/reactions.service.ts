import { inject, Injectable } from "@angular/core";
import { Firestore, updateDoc, doc, addDoc, setDoc, docSnapshots } from "@angular/fire/firestore";
import { ChannelService } from "./channel.service";
import { reload } from "firebase/auth";
import { UserService } from "./user.service";
import { collection, getDocs } from "firebase/firestore";
import { MessageService } from "./message.service";
import { share } from "rxjs";
import { SharedService } from "./shared.service";


@Injectable({
    providedIn: 'root',
})

export class ReactionService {
    firestore = inject(Firestore);
    channelService = inject(ChannelService);
    userService = inject(UserService);
    messageService = inject(MessageService);
    sharedService = inject(SharedService);
    reciever: any;
    thumbs: any[] = [];
    checks: any[] = [];
    isIconBar: boolean = false;
    isFooterIconBar: boolean = false;
    check: any[] = [];
    thumb: any[] = [];
    rocket: any[] = [];
    nerd: any[] = [];
    allReactions: any[] = [];
    isReaction: boolean = false;
    reactionIndex: number = 0;
    async addReaction(icon: string, message: any, user: any, recieverID: string, reactionType: string, chatKey: string) {

        this.sharedService.getDataFromLocalStorage('chat');
        const currentChat = this.sharedService.data;
        const messageID = message.id;
        const reactor = user;





        // const isDuplikate = this.checkDuplikate(reactions, reactor, reactionType);
        //if (isDuplikate) {
        //console.log('Du hast bereits auf diese Weise reagiert');

        //  return
        //}

        const reaction = this.getReactionObject(reactor, icon, reactionType);
        if (chatKey === 'thread') {
            this.sharedService.getDataFromLocalStorage('message');
            const chatMessage = this.sharedService.data;
            const chatMessageID = chatMessage.id
            console.log(chatMessage);
            const threadMessage = message;
            const threadID = threadMessage.id;
            console.log(threadMessage);
            console.log(user);
            console.log(recieverID);

            const docRef = collection(this.firestore, `channels/${recieverID}/messages/${chatMessageID}/thread/${threadID}/reactions`);
            console.log(docRef);

            await addDoc(docRef, reaction);
            await this.addReactionData(docRef, chatMessageID, threadID, icon, recieverID);

        } else {

            if (currentChat === 'user') {
                const firestoreID = this.messageService.generateFirestoreID();
                console.log(firestoreID);

                await this.saveChatReactions(user.id, messageID, reaction, firestoreID);
                await this.saveChatReactions(recieverID, messageID, reaction, firestoreID);
            }
            if (currentChat === 'channel') {
                const reactionDocRef = collection(this.firestore, `channels/${recieverID}/messages/${messageID}/reactions`);
                await addDoc(reactionDocRef, reaction);
                this.channelService.reloadChannelData(recieverID);
            }

        }

        await this.getCurrentReciever(recieverID);
        localStorage.setItem('reciever', JSON.stringify(this.reciever));



    }




    async saveChatReactions(ID: string, messageID: string, reaction: any, firestoreID: string) {
        const chatReactionRef = doc(this.firestore, `users/${ID}/messages/${messageID}/reactions/${firestoreID}`)
        await setDoc(chatReactionRef, reaction);
    }


    async addReactionData(docRef: any, chatMessageID: string, threadID: string, icon: string, recieverID: string) {
        const messageDocRef = doc(this.firestore, `channels/${recieverID}/messages/${chatMessageID}/thread/${threadID}`)
        await updateDoc(messageDocRef, {
            reactionLength: await this.getReactionCount(docRef),
            lastReaction: icon,
        })

    }

    async getReactionCount(docRef: any) {
        try {
            // Hole die Dokumente aus der reactions-Sammlung
            const querySnapshot = await getDocs(docRef);

            // Die Anzahl der Dokumente in der Sammlung
            const reactionCount = querySnapshot.size;

            // Gebe die Anzahl der Reaktionen aus
            console.log('Anzahl der Reaktionen:', reactionCount);

            // Wenn du die Anzahl irgendwo speichern oder verwenden möchtest, kannst du sie hier speichern
            console.log(reactionCount);
            return reactionCount
        } catch (error) {
            console.error('Fehler beim Abrufen der Reaktionen:', error);
            return 0;
        }

    }

    async findAllReactions(message: any, recieverID: string, userID: string, type: string, index: number) {
        this.reactionIndex = index;
        this.sharedService.getDataFromLocalStorage('messageID')
        const messageID = this.sharedService.data;
        console.log(messageID);
        console.log(message);
        console.log(recieverID);
        console.log(userID);
        console.log(type);
        const threadID = message.id;
        const docRef = collection(this.firestore, `channels/${recieverID}/messages/${messageID}/thread/${threadID}/reactions`);
        const docsnap = await getDocs(docRef)
        const reactions = docsnap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
        console.log(reactions);
        this.allReactions = reactions;
        console.log(docsnap);

        this.isReaction = true;

    }

    checkDuplikate(reactions: any[], user: any, reactionType: string) {
        let duplikate = false;
        reactions.forEach(reaction => {
            if (reaction.id === user.id) {
                if (reaction.type === reactionType) {
                    duplikate = true;
                }

            }
        })
        return duplikate;


    }

    getReactionObject(reactor: any, icon: string, reactionType: string) {
        console.log(reactor);

        return {
            name: reactor.name,
            id: reactor.id,
            icon: icon,
            time: new Date().toISOString(),
            type: reactionType,
        }

    }
    /*
        async updateReactions() {
            console.log(this.reciever);
    
            const newMessages = this.reciever.messages;
            console.log(newMessages);
    
            const reactionDocRef = doc(this.firestore, `channels/${this.reciever.id}`);
            await updateDoc(reactionDocRef, {
                messages: newMessages,
            });
        }
    */

    async getCurrentReciever(recieverID: string) {
        const channelData = await this.channelService.getChannels();
        console.log(channelData);
        channelData.forEach(channel => {
            if (channel.id === recieverID) {
                this.reciever = channel;
                console.log(this.reciever);

            }
        })
    }



    isCheck(message: any) {
        const reactions = message.reactions;

        let isCheck = false;
        reactions.forEach((reaction: any) => {
            if (reaction.type === 'check') {

                isCheck = true
            }
        })
        return isCheck;
    }
    isThumb(message: any) {
        const reactions = message.reactions;

        let isCheck = false;
        reactions.forEach((reaction: any) => {
            if (reaction.type === 'thumb') {

                isCheck = true
            }
        })
        return isCheck;
    }

    isRocket(message: any) {
        const reactions = message.reactions;

        let isCheck = false;
        reactions.forEach((reaction: any) => {
            if (reaction.type === 'rocket') {

                isCheck = true
            }
        })
        return isCheck;
    }

    isNerd(message: any) {
        const reactions = message.reactions;

        let isCheck = false;
        reactions.forEach((reaction: any) => {
            if (reaction.type === 'nerd') {

                isCheck = true
            }
        })
        return isCheck;
    }




    reactionCount(message: any, reactionType: string) {
        const reactions = message.reactions;
        return reactions.filter((reaction: any) => reaction.type === reactionType).length;

    }

    toogleIconBar() {
        this.isIconBar = !this.isIconBar
    }

    toggleFooterIconBar() {
        this.isFooterIconBar = !this.isFooterIconBar;
    }

    loadReactions(message: any, reactionType: string) {

        const allReactions = message.reactions;
        const reactions: any[] = [];
        allReactions.forEach((reaction: any) => {

            if (reaction.type === reactionType) {
                reactions.push(reaction);
            }
        })


        return reactions

    }

    isUser(reaction: any, user: any) {

        return reaction.id === user.id
    }

    /*
        async showReactions(recieverID: string, threadID: string, chatKey: string) {
            this.sharedService.getDataFromLocalStorage('message');
            const chatMessageID = this.sharedService.data.id;
            console.log(recieverID);
            console.log(threadID);
            console.log(chatKey);
            console.log(chatMessageID);
    
    
    
            //    const reactioDocRef = collection(this.firestore, `channels/${recieverID}/messages/${chatMessageID}/thread/${threadID}/reactions`);
            // const docSnapshot= await getDocs(reactioDocRef);
        }
    */



}