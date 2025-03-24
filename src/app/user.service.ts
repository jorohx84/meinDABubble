import { inject, Injectable } from "@angular/core";
import { User } from "./models/user.class";
import { Auth, onAuthStateChanged } from "@angular/fire/auth";
import { Firestore, doc, getDocs, collection, updateDoc } from "@angular/fire/firestore";


@Injectable({
    providedIn: 'root',
})
export class UserService {
    firestore = inject(Firestore);
    auth = inject(Auth);
    user: any = new User;
    users: any[] = [];
    currentUser: any;
    constructor() {
        this.setCurrentUser();
        this.getCurrentUser(this.user.uid);
    }



    getUser(): User {
        return this.user
    }

    setUser(user: any) {
        this.user = user;
        console.log(this.user);

    }

    async setOnlineStatus() {
        const currentUser = this.getUser();
        console.log(currentUser);
        currentUser.online = true;
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
               this.user=user;
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

    async getCurrentUser(id: string) {
        this.users = await this.getUsers();
        const user = this.users.find(user => user.id === id);
        if (user) {
            this.currentUser = user;
            console.log(this.currentUser);
            localStorage.setItem('user', JSON.stringify(user));
            return this.currentUser;
        }


    }

   

}