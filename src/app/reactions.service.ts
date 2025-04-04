import { inject, Injectable } from "@angular/core";
import { Firestore, updateDoc, doc, arrayUnion } from "@angular/fire/firestore";
import { ChannelService } from "./channel.service";
import { reload } from "firebase/auth";
import { UserService } from "./user.service";

@Injectable({
    providedIn: 'root',
})

export class ReactionService {
    firestore = inject(Firestore);
    channelService = inject(ChannelService);
    userService = inject(UserService);
    reciever: any;
    thumbs: any[] = [];
    checks: any[] = [];
    isIconBar: boolean = false;
    isFooterIconBar: boolean = false;
    check: any[] = [];
    thumb: any[] = [];
    rocket: any[] = [];
    nerd: any[] = [];
    async addReaction(icon: string, index: number, user: any, recieverID: any, reactionType: string) {
        console.log(recieverID);
        console.log(user);

        await this.getCurrentReciever(recieverID);
        const reactor = user;
        const message = this.reciever.messages[index];
        const reaction = this.getReactionObject(reactor, icon, reactionType);
        const reactions = message.reactions;
        const isDuplikate = this.checkDuplikate(reactions, reactor, reactionType);
        if (isDuplikate) {
            console.log('Du hast bereits auf diese Weise auf die Nachricht reagiert');

            return;
        }
        reactions.push(reaction);
        localStorage.setItem('reciever', JSON.stringify(this.reciever));
        await this.updateReactions();
        this.channelService.reloadChannelData(recieverID);


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

    async updateReactions() {
        console.log(this.reciever);

        const newMessages = this.reciever.messages;
        console.log(newMessages);

        const reactionDocRef = doc(this.firestore, `channels/${this.reciever.id}`);
        await updateDoc(reactionDocRef, {
            messages: newMessages,
        });
    }


    async getCurrentReciever(recieverID: string) {
        const userData = await this.userService.getUsers()
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

    loadReactions(message: any, reactionType:string) {

        const allReactions=message.reactions;
        const reactions:any[]=[];
        allReactions.forEach((reaction:any)=>{
            
            if (reaction.type===reactionType) {
                reactions.push(reaction);
            }
        })
     

        return reactions

    }

    isUser(reaction: any, user: any) {

        return reaction.id === user.id
    }
}