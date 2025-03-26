import { inject, Injectable } from "@angular/core";
import { User } from "./models/user.class";
import { Auth, onAuthStateChanged } from "@angular/fire/auth";
import { Firestore, doc, getDocs, collection, updateDoc } from "@angular/fire/firestore";
import { BehaviorSubject } from "rxjs";


@Injectable({
    providedIn: 'root',
})
export class UserService {
    firestore = inject(Firestore);
    auth = inject(Auth);
    user: any = new User;
    users: any[] = [];
    private userSubject = new BehaviorSubject<any>(null);
    user$ = this.userSubject.asObservable();
    constructor() {
        this.setCurrentUser();
        this.findCurrentUser(this.user.uid);
    }


    getUser(): User {
        console.log(this.user);
        
        return this.user;
    }

    setUser(user: any) {
        this.user = user;
        console.log(this.user);

    }

    async setOnlineStatus(status: string) {
        const currentUser = this.getUser();
        console.log(currentUser);
        if (status === 'login') {
            currentUser.online = true;
        }
        if (status === 'logout') {
            currentUser.online = false;
        }

        await this.updateOnlineStatus(currentUser);

    }


    async updateOnlineStatus(user: any) {
        if (user.uid) {
            const userRef = doc(this.firestore, 'users', user.uid)
            await updateDoc(userRef, {
                online: user.online,
            })
        }
    }

    setCurrentUser() {
        onAuthStateChanged(this.auth, (user) => {
            if (user) {
                this.user = user;
                console.log('User ist eingeloggt', this.user);
                
            } else {
                this.user = new User(null);
                console.log('User ist ausgeloggt');
                localStorage.removeItem('user');
            }


        });
    }


    async getUsers() {
        try {
            const usersCollection = collection(this.firestore, 'users');
            const userSnapshot = await getDocs(usersCollection);
            return userSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
        } catch (error) {
            console.error('Error loading users:', error);
            throw error;
        }
    }

    async findCurrentUser(id: string) {
        console.log(id);

        this.users = await this.getUsers();
        const user = this.users.find(user => user.id === id);
        if (user) {
            
            this.userSubject.next(user);

            localStorage.setItem('user', JSON.stringify(user));
            return user
        }
    }

    getCurrentUser() {
        console.log(this.userSubject.value);
        
        return this.userSubject.value
    }


    async setLoginTime() {
        console.log(this.user);
        const currentUser = await this.findCurrentUser(this.user.uid);
        console.log(currentUser);
        const loginTime: string = new Date().toISOString();
        const userDocRef = doc(this.firestore, `users/${currentUser.id}`)
        console.log(userDocRef);
        await updateDoc(userDocRef, {
            login: loginTime,
        })
        console.log(loginTime);
        console.log(currentUser.id);

        this.user = await this.findCurrentUser(currentUser.id);
        console.log(this.user);


    }

}