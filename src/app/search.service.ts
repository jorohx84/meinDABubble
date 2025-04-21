import { inject, Injectable, ɵsetAllowDuplicateNgModuleIdsForTest } from "@angular/core";
import { Subject } from "rxjs";
import { Firestore, arrayUnion, doc, updateDoc } from "@angular/fire/firestore";
import { User } from "./models/user.class";
import { ChannelService } from "./channel.service";
import { SharedService } from "./shared.service";
@Injectable({
    providedIn: 'root',
})
export class SearchService {
    firestore = inject(Firestore);
    channelService = inject(ChannelService);
    sharedService = inject(SharedService);
    isClicked: boolean = false;
    searchIsOpen: boolean = false;
    currentList: any[] = [];
    private openSearchList = new Subject<string>();
    openSearchList$ = this.openSearchList.asObservable();
    channels: any[] = [];
    currentMember: any;
    isSearch: boolean = false;
    currentArray: any[] = [];
    isChannel: boolean = false;
    reciever: any;
    result: string = '';
    currentChat: string = '';
    searchInput: string = '';
    isDevSearch: boolean = false;
    openMemberList(input: string, users: any[]) {
        if (input.length < 3) {
            this.searchIsOpen = false;
        } else {
            this.searchIsOpen = true;
        }
        this.searchForMembers(input, users);
        this.openSearchList.next('');
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

    setMember(index: number) {
        this.currentMember = this.currentList[index];
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
        //this.sharedService.openOverlay();
        this.sharedService.isOverlay = false;
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


        }

    }

    async loadChannels() {
        try {
            this.channels = await this.channelService.getChannels();
        } catch (error) {
            console.error('Error loading channels in component:', error);
        }
    }


    getCurrentList(input: string, users: any[], channels: any[]) {
        if (input.includes('#')) {
            this.currentArray = channels;
            this.searchForReciever(input, 'channel');
        } else if (input.includes('@')) {
            this.currentArray = users;
            this.searchForReciever(input, 'user');
        }
    }


    searchForReciever(input: string, chat: string) {
        if (input.length > 3) {
            this.isSearch = true;
            this.currentList = [];
            const INPUT = input.slice(1).toLowerCase().trim();
            this.startSearch(INPUT, chat);
        } else {
            this.isSearch = false;

        }
    }




    startSearch(input: string, chat: string) {
        console.log(chat);
        console.log(input);
        this.currentArray.forEach((object: any) => {

            if (chat === 'user') {
                this.searchInUsers(object, input);
            }
            if (chat === 'channel') {
                this.searchInChannels(object, input);
            }



        });

    }
    searchInUsers(object: any, input: string) {
        if (object.name.toLowerCase().includes(input) || object.email.includes(input)) {
            const duplette = this.currentList.find((search) => search.id === object.id);
            if (!duplette) {
                this.currentList.push(object);
                this.isChannel = false;
                this.currentChat = 'user'
                this.openSearchList.next('new');
            }
        }

    }

    searchInChannels(object: any, input: string) {
        if (object.name.toLowerCase().includes(input)) {
            const duplette = this.currentList.find(
                (search) => search.id === object.id
            );
            if (!duplette) {

                this.isChannel = true;
                this.currentChat = 'channel'
                this.openSearchList.next('new');
                this.currentList.push(object);
            }
        }
    }
    chooseReciver(index: number) {
        console.log('isHeaderSearch' + index);
        this.reciever = this.currentList[index];
        console.log(this.reciever);
        if (this.isChannel) {
            this.result = '#' + this.reciever.name;
        } else {
            this.result = '@' + this.reciever.name;

        }



    }

    searchInDevspace() {
        console.log(this.searchInput);

        if (this.searchInput.length >= 3) {
            this.isDevSearch = true;
        } else {
            this.isDevSearch = false;
        }
    }
}