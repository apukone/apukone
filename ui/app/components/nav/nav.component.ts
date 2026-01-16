import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router, RouterLink } from '@angular/router';
import { DataService } from '../../services/data.service';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { LoadingService } from '../../services/loading.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialog } from '@angular/material/dialog';
import { AgentsComponent } from '../agents/agents.component';
import { delay } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'nav-component',
  templateUrl: './nav.component.html',
  styleUrl: './nav.component.scss',
  imports: [
    MatButtonModule,
    RouterLink,
    CommonModule,
    MatMenuModule,
    MatIconModule,
    MatProgressBarModule,
    MatFormFieldModule,
    MatDividerModule,
    TranslatePipe
  ]
})
export class NavComponent implements OnInit {
  @Output() toggleSidenav = new EventEmitter<boolean>();

  loading$: Observable<boolean>;

  constructor(
    public dataService: DataService,
    public loadingService: LoadingService,
    private dialog: MatDialog,
    public languageService: LanguageService
  ) {
    this.loading$ = this.loadingService.loading$.pipe(delay(0));
  }

  ngOnInit() {
    if (this.dataService.isLoggedIn) {
      this.dataService.getAgents();
    }
  }

  sendEvent() {
    this.toggleSidenav.emit(true);
  }

  selectAgent(agent: any) {
    this.dataService.selectedAgent.next(agent);
    localStorage.setItem('selectedAgent', agent.id);
  }

  setLanguage(lang: 'fi' | 'en') {
    this.languageService.setLanguage(lang);
  }
}