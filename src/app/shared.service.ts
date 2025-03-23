import { Router } from "@angular/router";
import { Injectable, inject } from "@angular/core";
import { Subject } from "rxjs";
@Injectable({
    providedIn: 'root',
})
export class SharedService {
    router = inject(Router)
    user: any;
    private openChannelOverlay = new Subject<void>();
    openChannelOverlay$ = this.openChannelOverlay.asObservable();
    navigateToPath(path: string) {
        this.router.navigate([path]);
    }

    getUserFromLocalStorage() {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            this.user = JSON.parse(storedUser);
            console.log('Benutzer aus localStorage wiederhergestellt:', this.user);

        } else {
            console.log('Kein Benutzer im localStorage gefunden');
        }

    }

    openOverlayChannel() {
        this.openChannelOverlay.next();
    }
}