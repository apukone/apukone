import { ChangeDetectorRef, Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DataService } from '../../services/data.service';
import { CommonModule } from '@angular/common';
import { MessagePipe } from '../../pipes/message.pipe';
import { RolePipe } from '../../pipes/role.pipe';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ScrollService } from '../../services/scroll.service';
import { MarkdownModule } from 'ngx-markdown';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
    selector: 'chat-component',
    templateUrl: './chat.component.html',
    styleUrl: './chat.component.scss',
    imports: [
        CommonModule,
        MessagePipe,
        RolePipe,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MarkdownModule,
        TranslatePipe
    ]
})
export class ChatComponent {
    messages: any[] = [];
    chatId = "";
    form: FormGroup;
    constructor(
        private route: ActivatedRoute,
        public dataService: DataService,
        private cdr: ChangeDetectorRef,
        private scrollService: ScrollService
    ) {
        this.form = new FormGroup({
            message: new FormControl('')
        });
    }

    async ngOnInit() {
        this.dataService.selectedAgent.subscribe(agent => {
            if (agent) {
                this.form.enable();
            } else {
                this.form.disable();
            }
        });

        this.route.params.subscribe(params => {
            this.chatId = params["id"];
            this.getMessages(this.chatId);
            this.dataService.getEventStream().subscribe(e => {
                if (e.type === 'message_status' && e.chatId === this.chatId) {
                    const msg = this.messages.find(m => m.id === e.messageId);
                    if (msg) {
                        msg.status = e.status;
                        this.cdr.detectChanges();
                    }
                } else if (e.chat_id == this.chatId) {
                    this.messages.push(e);
                    this.cdr.detectChanges();
                    this.scrollService.triggerScroll();
                }
            });
        });

    }

    async getMessages(chatId: string) {
        this.messages = await this.dataService.getMessages(chatId) as any[];
        this.form.get("agent")?.setValue(this.messages[0].agent_id || this.messages[0].agentId);
        this.scrollService.triggerScroll();
    }

    async send(event?: Event) {
        if (event) {
            event.preventDefault();
        }
        if (this.form.valid && this.dataService.selectedAgent.value) {
            this.form.disable();
            await this.dataService.sendMessage(this.form.get("message")?.value, this.chatId, this.dataService.selectedAgent.value.id);
            this.form.get("message")?.setValue("");
            await this.getMessages(this.chatId);
            this.form.enable();
        }
    }

    trackByFn(index: number, item: any) {
        return index; // or use item.id if objects have unique IDs
    }

    getAgentName(agentId: string): string {
        const agents = this.dataService.agents.value;
        if (!agents) return 'Unknown Agent';
        const agent = agents.find(a => a.id === agentId);
        return agent ? agent.title : 'Agent';
    }
}