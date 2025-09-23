// src/app/app.routes.ts

import { Routes } from '@angular/router';
import { AuthGuard } from './services/auth.guard';
import { LoginComponent } from './component/login/login.component/login.component';
import { ChatbotComponent } from './component/chatbot/chatbot.component/chatbot.component';
import { AdminComponent } from './admin/admin/admin';
import { IdeaFormComponent } from './component/idea-form/idea-form.component/idea-form.component';

export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'chat', component: ChatbotComponent },
  { path: 'login', component: LoginComponent },
  { path: 'admin', component: AdminComponent, canActivate: [AuthGuard] },
  { path: 'submit-idea', component: IdeaFormComponent } // Adicione a nova rota
];