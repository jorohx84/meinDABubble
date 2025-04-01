import { Router } from "@angular/router";
import { Injectable, inject } from "@angular/core";
import { BehaviorSubject, Subject, subscribeOn } from "rxjs";
@Injectable({
    providedIn: 'root',
})
export class SharedService {
    router = inject(Router)
    user: any;
    data: any;
    currentProfile: any;
    private openChannelOverlay = new Subject<void>();
    openChannelOverlay$ = this.openChannelOverlay.asObservable();

    private loadChatWindow = new Subject<void>();
    loadChatWindow$ = this.loadChatWindow.asObservable();
    private openThread = new Subject<string>();
    openThread$ = this.openThread.asObservable();
    //private openGeneralOverlay = new Subject<void>();
    //openGeneralOverlay$ = this.openGeneralOverlay.asObservable();
    private logoutObserver = new Subject<void>();
    logoutObserver$ = this.logoutObserver.asObservable();
    private profileObserver = new Subject<string>();
    profileObserver$ = this.profileObserver.asObservable();
    private recieverObserver = new BehaviorSubject<string>('');
    recieverObserver$ = this.recieverObserver.asObservable();
    private userObserver = new Subject<void>();
    userObserver$ = this.userObserver.asObservable();
    private closeMember = new Subject<void>();
    closeMember$ = this.closeMember.asObservable();
    private editObserver=new Subject<void>();
    editObserver$=this.editObserver.asObservable();
    reciever: any;
    chat: string = '';
    message: any;
  
    isReceiver: boolean = false;
    messageIndex: number = 0;
    isChange: boolean = false;
    isSearch: boolean = false;
    isOverlay: boolean = false;
    isRecieverProfile: boolean = false;
    member: any;
    isMember: boolean = false;
    isLogout: boolean = false;
    isProfileOpen: boolean = false;
    isEdit: boolean = false;
    navigateToPath(path: string) {
        this.router.navigate([path]);
    }

    getUserFromLocalStorage() {
        const storedData = localStorage.getItem('user');
        if (storedData) {
            this.user = JSON.parse(storedData);
            console.log('Benutzer aus localStorage wiederhergestellt:', this.user);

        } else {
            console.log('Kein Benutzer im localStorage gefunden');
        }

    }

    getDataFromLocalStorage(data: any) {
        const storedData = localStorage.getItem(data);
        if (storedData) {
            try {
                this.data = JSON.parse(storedData);
                console.log('Daten aus localStorage wiederhergestellt (als JSON):', this.data);
            } catch (e) {
                this.data = storedData;
                console.log('Daten aus localStorage wiederhergestellt (als String):', this.data);
            }
        } else {
            console.log('Keine Daten im localStorage gefunden');
        }
    }

    openOverlayChannel() {
        this.openChannelOverlay.next();
    }

  

    loadChat() {
        this.loadChatWindow.next();
    }

    getReciever(reciever: any, user: any, chat: string) {
        localStorage.setItem('reciever', JSON.stringify(reciever));
        localStorage.setItem('chat', chat);
        this.chat = chat;
        this.reciever = reciever;
        this.user = user;

    }

    setMessage(message: any, index: number) {
        this.messageIndex = index;
        localStorage.setItem('messageIndex', JSON.stringify(index));
        console.log(this.messageIndex);

        this.message = message;
        localStorage.setItem('message', JSON.stringify(this.message));
    }

    setUser(userData: any) {
        this.user = userData;
        console.log(this.user);

    }
    setReciever(recieverData: any) {
        this.reciever = recieverData;
        console.log(this.reciever);

    }

    initializeThread(key: string) {
        this.openThread.next(key);
    }

    //openOverlay() {
      //  this.isOverlay = !this.isOverlay
        //this.openGeneralOverlay.next();
    //}

    logoutUser() {
        this.logoutObserver.next();
    }

    profileObserve(key: string) {
        this.profileObserver.next(key);
    }

    recieverObserve(key: string) {
        this.recieverObserver.next(key);
    }

    userObserve() {

        this.userObserver.next();
    }


    closeAddMember() {
        this.closeMember.next();
    }

    changeAddMember(event: Event) {
        this.isChange = !this.isChange;
        this.isSearch = !this.isSearch;
        this.isOverlay = !this.isOverlay;
        console.log(this.isChange);
        event.stopPropagation();
    }
    toggleSearch(event: Event) {
        this.isSearch = !this.isSearch;
        this.isOverlay = !this.isOverlay;
        this.isChange = false;
        event.stopPropagation();

    }

    closeOverlay() {
        this.isChange = false;
        this.isSearch = false;
        this.isOverlay = false;
        this.isLogout = false;
        this.isProfileOpen = false;
        this.isEdit=false;

    }

    changeIsChange(event:Event) {
        this.isChange = false;
        event.stopPropagation();
    }

    closeProfile() {
        //this.profileObserve('');


        if (this.isRecieverProfile === true) {
            this.isOverlay=false;

        }
        this.isRecieverProfile = false;
        this.isMember = false;
        this.isProfileOpen = false;
 
    }


    openMemberProfile(receiver: any) {
        this.isSearch = false;
        this.isChange = false;
        this.isRecieverProfile = true;
        console.log(receiver);
        this.isMember = true;
        this.currentProfile = receiver;
        this.isLogout = false;
        this.recieverObserver.next('');
    }

    toggleLogout() {
        this.isLogout = !this.isLogout;
        this.isOverlay = !this.isOverlay;
        //this.sharedservice.openOverlay();
    }

    triggerEditChannel(reciever:any){

        console.log(reciever);
        this.editObserver.next(reciever);
    }


}


