import { Component, OnInit } from '@angular/core';
import { DataService } from '../../services/data.service';
import { MatButtonModule } from '@angular/material/button';
import { LoadingService } from '../../services/loading.service';
import { CommonModule } from '@angular/common';
import { Agent } from '../../interfaces/query.interface';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'agent-manage.component',
  templateUrl: './agent-manage.component.html',
  styleUrl: './agent-manage.component.scss',
  imports: [
    MatButtonModule,
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatIconModule,
    RouterLink,
    MatProgressSpinnerModule,
    TranslatePipe
  ]
})
export class AgentManageComponent implements OnInit {

  form: FormGroup;
  shareForm: FormGroup;
  sharedUsers: any[] = [];
  message: string = '';
  error: string = '';
  agent: Agent | null = null;
  agentId: string | null = null;

  constructor(
    public dataService: DataService,
    public loadingService: LoadingService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.form = new FormGroup({
      id: new FormControl(''),
      title: new FormControl(''),
      description: new FormControl(''),
      token: new FormControl('')
    });
    this.form.disable();

    this.shareForm = new FormGroup({
      username: new FormControl('', Validators.required)
    });
  }

  async ngOnInit() {
    this.route.paramMap.subscribe(async params => {
      this.agentId = params.get('id');
      if (this.agentId) {
        await this.loadAgent();
      }
    });
  }

  async loadAgent() {
    // Ideally get specific agent, but for now filtering from list is okay if list is cached, otherwise we might need fetch specific
    // Let's ensure we have agents loaded
    if (!this.dataService.agents.value) {
      await this.dataService.getAgents();
    }

    this.agent = this.dataService.agents.value?.find(a => a.id === this.agentId) || null;

    if (this.agent) {
      this.form.patchValue(this.agent);
      if (this.agent.isOwner) {
        this.loadSharedUsers();
      }
    } else {
      this.error = 'Agent not found';
    }
  }

  async loadSharedUsers() {
    if (!this.agent) return;
    const res: any = await this.dataService.getSharedUsers(this.agent.id);
    if (!res.error) {
      this.sharedUsers = res;
    }
  }

  async share() {
    if (this.shareForm.invalid || !this.agent) return;
    this.message = '';
    this.error = '';
    const { username } = this.shareForm.value;
    const res: any = await this.dataService.shareAgent(this.agent.id, username);
    if (res.error) {
      this.error = res.error;
    } else {
      this.message = 'Agent shared successfully';
      this.shareForm.reset();
      this.loadSharedUsers();
    }
  }

  async unshare(userId: string) {
    if (!this.agent) return;
    if (!confirm('Are you sure you want to remove access for this user?')) return;
    this.message = '';
    this.error = '';
    const res: any = await this.dataService.unshareAgent(this.agent.id, userId);
    if (res.error) {
      this.error = res.error;
    } else {
      this.message = 'Access removed';
      this.loadSharedUsers();
    }
  }

  async deleteAgent() {
    if (!this.agent) return;
    if (!confirm('Are you sure you want to delete this agent? This action cannot be undone.')) return;
    await this.dataService.deleteAgent(this.agent.id);
    await this.dataService.getAgents();

    if (this.dataService.selectedAgent.value?.id == this.agent.id) {
      this.dataService.selectedAgent.next(null);
      localStorage.removeItem('selectedAgent');
    }
    this.router.navigate(['/agents']);
  }
}