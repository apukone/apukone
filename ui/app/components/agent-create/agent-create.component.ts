import { Component } from '@angular/core';
import { DataService } from '../../services/data.service';
import { MatButtonModule } from '@angular/material/button';
import { LoadingService } from '../../services/loading.service';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'agent-create.component',
  templateUrl: './agent-create.component.html',
  styleUrl: './agent-create.component.scss',
  imports: [
    MatButtonModule,
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    RouterLink,
    MatIconModule,
    TranslatePipe
  ]
})
export class AgentCreateComponent {

  form: FormGroup;
  error: string = '';

  constructor(
    public dataService: DataService,
    public loadingService: LoadingService,
    private router: Router
  ) {
    this.form = new FormGroup({
      title: new FormControl('', Validators.required),
      description: new FormControl('', Validators.required)
    });
  }

  async ngOnInit() { }

  async createAgent() {
    if (this.form.valid) {
      this.error = '';
      try {
        const res = await this.dataService.createAgent(this.form.get('title')?.value, this.form.get('description')?.value);
        if (res && (res as any).id) {
          await this.dataService.getAgents();
          this.router.navigate(['/agents', (res as any).id]);
        } else {
          this.error = 'Failed to create agent. Please try again.';
        }
      } catch (err) {
        this.error = 'An error occurred during creation.';
      }
    }
  }
}