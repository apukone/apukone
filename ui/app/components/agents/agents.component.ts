import { Component } from '@angular/core';
import { DataService } from '../../services/data.service';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Agent } from '../../interfaces/query.interface';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { LoadingService } from '../../services/loading.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'agents-component',
  templateUrl: './agents.component.html',
  styleUrl: './agents.component.scss',
  imports: [
    MatTableModule,
    MatButtonModule,
    CommonModule,
    MatRadioModule,
    TranslatePipe
  ]
})
export class AgentsComponent {

  displayedColumns: string[] = ['title', 'status', 'id', 'manage'];
  dataSource: MatTableDataSource<Agent> = new MatTableDataSource<Agent>();

  constructor(
    public dataService: DataService,
    public loadingService: LoadingService,
    private router: Router
  ) {
  }

  async ngOnInit() {
    this.dataService.getAgents();
    this.dataService.agents.subscribe((val: any) => {
      this.dataSource = new MatTableDataSource(val);
    });
  }

  async createAgent() {
    this.router.navigate(['/agents/create']);
  }

  async manageAgent(agentId: string) {
    this.router.navigate(['/agents', agentId]);
  }

  async removeAccess(agentId: string) {
    if (!confirm('Are you sure you want to remove this agent from your list?')) return;
    const myId = this.dataService.getUserId();
    if (!myId) return;

    await this.dataService.unshareAgent(agentId, myId);
    await this.dataService.getAgents();

    if (this.dataService.selectedAgent.value?.id == agentId) {
      this.dataService.selectedAgent.next(null);
      localStorage.removeItem('selectedAgent');
    }
  }

  async deleteAgent(agentId: string) {
    if (!confirm('Are you sure you want to delete this agent entirely?')) return;
    await this.dataService.deleteAgent(agentId);
    await this.dataService.getAgents();
    if (this.dataService.selectedAgent.value?.id == agentId) {
      this.dataService.selectedAgent.next(null);
      localStorage.removeItem('selectedAgent');
    }
  }
}