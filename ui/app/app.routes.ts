import { Routes } from '@angular/router';
import { NewChatComponent } from './components/new-chat/new-chat.component';
import { LoginComponent } from './components/login/login.component';
import { AuthGuard } from './services/auth.guard';
import { AgentsComponent } from './components/agents/agents.component';
import { ChatComponent } from './components/chat/chat.component';
import { MyProfileComponent } from './components/my-profile/my-profile.component';
import { AdminUsersComponent } from './components/admin-users/admin-users.component';
import { AgentCreateComponent } from './components/agent-create/agent-create.component';
import { AgentManageComponent } from './components/agent-manage/agent-manage.component';

export const routes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        redirectTo: 'login'
    },
    {
        path: 'login',
        component: LoginComponent
    },
    {
        path: 'chat',
        component: NewChatComponent,
        canActivate: [AuthGuard]
    },
    {
        path: 'agents',
        component: AgentsComponent,
        canActivate: [AuthGuard]
    },
    {
        path: 'agents/create',
        component: AgentCreateComponent,
        canActivate: [AuthGuard]
    },
    {
        path: 'agents/:id',
        component: AgentManageComponent,
        canActivate: [AuthGuard]
    },
    {
        path: 'chat/:id',
        component: ChatComponent,
        canActivate: [AuthGuard]
    },
    {
        path: 'profile',
        component: MyProfileComponent,
        canActivate: [AuthGuard]
    },
    {
        path: 'admin',
        component: AdminUsersComponent,
        canActivate: [AuthGuard]
    }
];
