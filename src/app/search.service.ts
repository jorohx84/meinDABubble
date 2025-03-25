import { inject, Injectable, ɵsetAllowDuplicateNgModuleIdsForTest } from "@angular/core";
import { Subject } from "rxjs";
import { Firestore, arrayUnion, doc, updateDoc } from "@angular/fire/firestore";
import { User } from "./models/user.class";
import { ChannelService } from "./channel.service";
@Injectable({
    providedIn: 'root',
})
export class SearchService {
    firestore = inject(Firestore);
    channelService = inject(ChannelService);
    isClicked: boolean = false;
    searchIsOpen: boolean = false;
    currentList: any[] = [];
    private openSearchList = new Subject<void>();
    openSearchList$ = this.openSearchList.asObservable();
    channels: any[] = [];
    currentMember:any;

    openMemberList(input: string, users: any[]) {
        if (input.length < 3) {
            this.searchIsOpen = false;
        } else {
            this.searchIsOpen = true;
        }
        this.searchForMembers(input, users);
        this.openSearchList.next();
    }

    searchForMembers(input: string, users: any[]) {
        this.currentList = []
        const INPUT = input.toLocaleLowerCase().trim();
        users.forEach((user: any) => {
            if (user.name.toLocaleLowerCase().trim().includes(input)) {
                this.currentList.push(user);
            }
        });
    }

    setMember(index: number){
this.currentMember=this.currentList[index];
console.log(this.currentMember);

        
    }

    async addMember(channel: any) {
      
        
        await this.loadChannels();
        console.log(this.channels);
        channel.id
        const currentChannel = this.channels.find((obj: any) => obj.id === channel.id)
        const memberData = this.currentMember;
        const members = currentChannel.members;
        const duplette = members.find((dupp: any) => dupp.id === memberData.id);
        if (duplette) {
            console.log('User ist bereits Mitglied des Channels')
            return
        }
        const member = this.getMember(memberData);
        await this.saveMemberInFirestore(member, channel)

    }

    async saveMemberInFirestore(data: any, channel: any) {
        const channelDocRef = doc(this.firestore, `channels/${channel.id}`)
        await updateDoc(channelDocRef, {
            members: arrayUnion(data),
        })
    }

    getMember(memberData: any) {
        return {
            name: memberData.name,
            email: memberData.email,
            avatar: memberData.avatar,
            online: memberData.online,
            id: memberData.id,
            messages: memberData.messages,

        }

    }

    async loadChannels() {
        try {
            this.channels = await this.channelService.getChannels();
        } catch (error) {
            console.error('Error loading channels in component:', error);
        }
    }

}