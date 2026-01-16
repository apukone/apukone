import { ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { NavComponent } from './components/nav/nav.component';
import { DataService } from './services/data.service';
import { AsyncPipe, CommonModule } from '@angular/common';
import { MatDrawer, MatDrawerContent, MatSidenavModule } from '@angular/material/sidenav';
import { ScrollService } from './services/scroll.service';
import { MatButtonModule } from '@angular/material/button';
import { BehaviorSubject } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    NavComponent,
    CommonModule,
    MatSidenavModule,
    RouterLink,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  @ViewChild('drawerContent') drawerContent!: MatDrawerContent;
  @ViewChild('drawer') drawer!: MatDrawer;

  isOpenClass = new BehaviorSubject('drawer-closed');
  constructor(
    public dataService: DataService,
    private scrollService: ScrollService
  ) {}
  onEventReceived(event: boolean) {
    this.drawer.toggle();
  }
  ngOnDestroy() {
    this.dataService.disconnect();
  }
  ngAfterViewInit() {
    this.scrollService.scroll$.subscribe(() => {
      this.scrollToBottom();
    });
  }

  private scrollToBottom(): void {
    if (this.drawerContent) {
      setTimeout(() => {
        this.drawerContent.scrollTo({bottom: 0, behavior: "instant"});
      }, 100);
    }
  }
  async deleteChat(chatId: string) {
    await this.dataService.deleteChat(chatId);
    this.dataService.chats = await this.dataService.getChats() as any;
  }
}
