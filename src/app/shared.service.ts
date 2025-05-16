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
    private editObserver = new Subject<void>();
    editObserver$ = this.editObserver.asObservable();
    reciever: any;
    chat: string = '';
    message: any;
    devSlide: boolean = false;
    isReceiver: boolean = false;
    resize720: boolean = false;
    resize407: boolean = false;
    isChange: boolean = false;
    isSearch: boolean = false;
    isOverlay: boolean = false;
    isRecieverProfile: boolean = false;
    member: any;
    isMember: boolean = false;
    isLogout: boolean = false;
    isProfileOpen: boolean = false;
    isEdit: boolean = false;
    isAddChannel: boolean = false;
    screenWidth: number = 0;
    hideDevResp: boolean = false;
    transformSearch: boolean = false;
    editProfile: boolean = false;
    menuBarIndex: number | null = null;
    openSearch: boolean = false;


    ngOnInit() {
        if (window.innerWidth <= 720) {
            this.resize720 = true;
        }
    }


    navigateToPath(path: string) {
        this.router.navigate([path]);
    }


    getUserFromLocalStorage() {
        const storedData = localStorage.getItem('user');
        if (storedData) {
            this.user = JSON.parse(storedData);
        }
    }

    getDataFromLocalStorage(data: any) {
        const storedData = localStorage.getItem(data);
        if (storedData) {
            try {
                this.data = JSON.parse(storedData);
            } catch (e) {
                this.data = storedData;
            }
            return storedData
        } else {
            return null
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



    setUser(userData: any) {
        this.user = userData;
    }


    setReciever(recieverData: any) {
        this.reciever = recieverData;
    }


    initializeThread(key: string) {
        this.openThread.next(key);
    }


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
        event.stopPropagation();
    }


    toggleSearch(event: Event) {
        this.isSearch = !this.isSearch;
        this.isOverlay = !this.isOverlay;
        this.isChange = false;
        event.stopPropagation();
        if (this.checkLowerWidth(540)) {
            this.transformSearch = !this.transformSearch
        }

    }


    closeOverlay() {
        this.isChange = false;
        this.isSearch = false;
        this.isOverlay = false;
        this.isLogout = false;
        this.isProfileOpen = false;
        this.isEdit = false;
        this.transformSearch = false;

    }

    changeIsChange(event: Event) {
        this.isChange = false;
        event.stopPropagation();
    }

    closeProfile() {
        if (this.isRecieverProfile === true) {
            this.isOverlay = false;
        }
        this.isRecieverProfile = false;
        this.isMember = false;
        this.isProfileOpen = false;

        if (this.checkLowerWidth(540)) {
            this.editProfile = false;
        }
    }


    openMemberProfile(receiver: any) {
        this.isSearch = false;
        this.isChange = false;
        this.isRecieverProfile = true;
        this.isMember = true;
        this.currentProfile = receiver;
        this.isLogout = false;
        this.recieverObserver.next('');
        if (this.checkLowerWidth(540)) {
            this.editProfile = true;
        }
    }


    toggleLogout() {
        this.isLogout = !this.isLogout;
        this.isOverlay = !this.isOverlay;
    }


    triggerEditChannel(reciever: any) {
        this.editObserver.next(reciever);
    }


    toogleDevspace() {
        this.devSlide = !this.devSlide;
        localStorage.setItem('devSlide', JSON.stringify(this.devSlide));
    }


    checkLowerWidth(widthToCheck: number) {
        return window.innerWidth < widthToCheck;
    }


    toggleMenuBar(index: number) {
        if (this.menuBarIndex === index) {
            this.menuBarIndex = null;
        } else {
            this.menuBarIndex = index
        }
    }
}

