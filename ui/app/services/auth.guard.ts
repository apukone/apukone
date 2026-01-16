import { Injectable } from "@angular/core";
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from "@angular/router";
import { DataService } from "./data.service";
import { Agent } from "../interfaces/query.interface";

 @Injectable({providedIn: 'root'})
 export class AuthGuard implements CanActivate{
     constructor(
        private router: Router,
        private dataService: DataService
    ){}
     async canActivate(router: ActivatedRouteSnapshot, state: RouterStateSnapshot){
        // check if the user is logged in
        if(localStorage.getItem('access_token')) {
            const selectedAgentId = localStorage.getItem('selectedAgent');
            if(selectedAgentId) {
                await this.dataService.getAgents();
                if(this.dataService.agents.value) {
                    const selectedAgent = this.dataService.agents.value.find(agent => agent.id == selectedAgentId) || null;
                    this.dataService.selectedAgent.next(selectedAgent);
                }
            }
            this.dataService.chats = await this.dataService.getChats() as any;
            this.dataService.connectToEvents();
            return true;
        }

        // not logged in so redirect to login page with the return url
        this.router.navigate(['/']);
        return false;
     }
 }