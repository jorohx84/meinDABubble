import { Routes } from '@angular/router';
import { IntroComponent } from './intro/intro.component';
import { SigninComponent } from './signin/signin.component';
import { AvatarComponent } from './avatar/avatar.component';
import { LoginComponent } from './login/login.component';
import { ChatComponent } from './chat/chat.component';
export const routes: Routes = [
   { path: '', component: SigninComponent },
   { path: 'signin', component: SigninComponent },
   { path: 'avatar', component: AvatarComponent },
   { path: 'login', component: LoginComponent },
   { path: 'chat', component: ChatComponent },
];
