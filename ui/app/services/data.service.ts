import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom, Subject } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { Agent } from '../interfaces/query.interface';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  private apiUrl = environment.apiUrl;
  isLoggedIn = localStorage.getItem('access_token');
  chats = null;
  private eventSource: EventSource | null = null;
  private eventSourceSubject: Subject<any> = new Subject();
  private retryDelay = 1000; // Start with 1 second
  private maxRetryDelay = 30000; // Maximum 30 seconds
  private reconnectTimeout: any = null; // Store timeout reference
  private lastHeartbeat: number = Date.now();
  private heartbeatInterval: any = null;
  selectedAgent = new BehaviorSubject<Agent | null>(null);
  agents = new BehaviorSubject<Agent[] | null>(null);

  constructor(
    private http: HttpClient,
    private router: Router
  ) { }

  async adminCreateUser(username: string, password: string, email: string, role: string) {
    try {
      const user = { username, password, email, role };
      return await firstValueFrom(this.http.post(this.apiUrl + '/register', user));
    } catch (err: any) {
      return this.handleError(err);
    }
  }

  async shareAgent(agentId: string, username: string) {
    try {
      return await firstValueFrom(this.http.post(this.apiUrl + '/shareAgent', { agentId, username }));
    } catch (err: any) {
      return this.handleError(err);
    }
  }

  async unshareAgent(agentId: string, userId: string) {
    try {
      return await firstValueFrom(this.http.post(this.apiUrl + '/unshareAgent', { agentId, userId }));
    } catch (err: any) {
      return this.handleError(err);
    }
  }

  async getSharedUsers(agentId: string) {
    try {
      return await firstValueFrom(this.http.post(this.apiUrl + '/getSharedUsers', { agentId }));
    } catch (err: any) {
      return this.handleError(err);
    }
  }

  async getAgentStats(agentId: string) {
    try {
      return await firstValueFrom(this.http.get(`${this.apiUrl}/${agentId}/statistics`));
    } catch (err: any) {
      return this.handleError(err);
    }
  }

  async getAllUsers() {
    try {
      return await firstValueFrom(this.http.get(this.apiUrl + '/users'));
    } catch (err: any) {
      return this.handleError(err);
    }
  }

  async deleteUserById(id: string) {
    try {
      return await firstValueFrom(this.http.delete(this.apiUrl + '/users/' + id));
    } catch (err: any) {
      return this.handleError(err);
    }
  }

  private handleError(err: any) {
    if (err.error && err.error.error) {
      return { error: err.error.error };
    }
    return { error: 'An unexpected error occurred' };
  }

  async changePassword(password: string) {
    try {
      return await firstValueFrom(this.http.post(this.apiUrl + '/changePassword', { password }));
    } catch (err) {
      return err;
    }
  }

  async login(username: string, password: string) {
    try {
      const user = { username, password };
      const response = await firstValueFrom(this.http.post(this.apiUrl + '/login', user));
      this.processAuthResponse(response as any);
      return response;
    } catch (err) {
      return err;
    }
  }

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('selectedAgent');
    this.isLoggedIn = null;
    this.disconnect();
    this.router.navigate(['/']);
  }

  get isAdmin(): boolean {
    const token = localStorage.getItem('access_token');
    if (!token) return false;
    try {
      const decoded: any = JSON.parse(atob(token.split('.')[1]));
      return decoded.user?.role === 'ADMIN';
    } catch {
      return false;
    }
  }

  getUserId(): string | null {
    const token = localStorage.getItem('access_token');
    if (!token) return null;
    try {
      const decoded: any = JSON.parse(atob(token.split('.')[1]));
      return decoded.user?.id || null;
    } catch {
      return null;
    }
  }

  private async processAuthResponse(response: any) {
    if (response && response.token) {
      localStorage.setItem('access_token', response.token);
      this.isLoggedIn = localStorage.getItem('access_token');
      this.getAgents();
      this.router.navigate(['/chat']);
    }
  }

  async createAgent(title: string, description: string) {
    const create = await firstValueFrom(this.http.post(this.apiUrl + '/createAgent', { title, description }));
    return create;
  }

  async createChat(message: string, agentId: string) {
    const create = await firstValueFrom(this.http.post(this.apiUrl + '/createChat', { message: message, agentId: agentId })) as any;
    this.router.navigate(['/chat/' + create.id]);
    this.chats = await this.getChats() as any;
    return create;
  }

  async getAgents() {
    this.agents.next(await firstValueFrom(this.http.post(this.apiUrl + '/getAllAgents', {})) as Agent[]);;
  }

  async getChats() {
    return await firstValueFrom(this.http.post(this.apiUrl + '/getAllChats', {}));
  }

  async getUser() {
    return await firstValueFrom(this.http.post(this.apiUrl + '/getUser', {}));
  }

  async deleteUser() {
    return await firstValueFrom(this.http.post(this.apiUrl + '/deleteUser', {}));
  }

  async deleteChat(chatId: string) {
    return await firstValueFrom(this.http.post(this.apiUrl + '/deleteChat', { chatId: chatId }));
  }

  async deleteAgent(agentId: string) {
    return await firstValueFrom(this.http.post(this.apiUrl + '/deleteAgent', { agentId: agentId }));
  }

  async getMessages(chatId: string): Promise<any[]> {
    return await firstValueFrom(this.http.post(this.apiUrl + '/getAllMessages', { chatId: chatId })) as any[];
  }

  async sendMessage(messageContent: string, chatId: string, agentId: string): Promise<any> {
    return await firstValueFrom(this.http.post(this.apiUrl + '/sendMessage', { message: messageContent, chatId: chatId, agentId: agentId }));
  }

  public connectToEvents(): void {
    // Create a new EventSource connection
    if (this.eventSource === null) {
      this.eventSource = new EventSource(`${this.apiUrl}/users/results?token=${localStorage.getItem('access_token')}`);
      this.startHeartbeatMonitor();

      // Listen for messages from the server
      // Listen for messages from the server
      this.eventSource.addEventListener('ping', (event) => {
        this.lastHeartbeat = Date.now();
      });

      this.eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data); // Assuming the server sends JSON data

        // Handle Agent Status Updates Globally
        if (data === 'ping' || data.type === 'ping') {
          this.lastHeartbeat = Date.now();
          return;
        }

        this.lastHeartbeat = Date.now();

        if (data.type === 'agent_status') {
          const currentAgents = this.agents.value;
          if (currentAgents) {
            const updatedAgents = currentAgents.map(agent => {
              if (agent.id === data.agentId) {
                return { ...agent, isConnected: data.isConnected };
              }
              return agent;
            });
            this.agents.next(updatedAgents);
          }

          // Also update selectedAgent if it matches
          const currentSelected = this.selectedAgent.value;
          if (currentSelected && currentSelected.id === data.agentId) {
            this.selectedAgent.next({ ...currentSelected, isConnected: data.isConnected });
          }
        }

        this.eventSourceSubject.next(data);
        this.resetRetryDelay(); // Reset retry delay on successful message
      };

      // Optional: Handle errors
      this.eventSource.onerror = (error) => {
        this.eventSource?.close();
        this.eventSource = null;
        // Retry connection with exponential backoff
        this.scheduleReconnect();
      };
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectTimeout = setTimeout(() => {
      this.connectToEvents();

      // Increase retry delay (exponential backoff)
      this.retryDelay = Math.min(this.retryDelay * 2, this.maxRetryDelay);
    }, this.retryDelay);
  }

  private resetRetryDelay(): void {
    this.retryDelay = 1000; // Reset delay after successful connection
  }

  private startHeartbeatMonitor() {
    this.stopHeartbeatMonitor();
    this.lastHeartbeat = Date.now();
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      if (now - this.lastHeartbeat > 35000) { // 35 seconds (buffer over 15s ping)
        console.warn('Heartbeat timeout - reconnecting SSE');
        this.disconnect();
        this.connectToEvents();
      }
    }, 5000); // Check every 5 seconds
  }

  private stopHeartbeatMonitor() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // Method to close the SSE connection
  public disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      this.stopHeartbeatMonitor();
    }
  }

  // Observable to expose the event data to your components
  public getEventStream() {
    return this.eventSourceSubject.asObservable();
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }

}