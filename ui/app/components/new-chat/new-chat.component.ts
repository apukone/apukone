import { Component } from '@angular/core';
import { DataService } from '../../services/data.service';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TextFieldModule } from '@angular/cdk/text-field';
import { TranslatePipe } from '../../pipes/translate.pipe';
@Component({
    selector: 'new-chat-component',
    templateUrl: './new-chat.component.html',
    imports: [
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        CommonModule,
        MatIconModule,
        TextFieldModule,
        TranslatePipe
    ],
    styleUrl: './new-chat.component.scss'
})
export class NewChatComponent {
    form: FormGroup;
    constructor(
        public dataService: DataService
    ) {
        this.form = new FormGroup({
            message: new FormControl('', Validators.required)
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
    }

    async createChat() {
        if (this.form.valid && this.dataService.selectedAgent.value) {
            this.form.disable();
            await this.dataService.createChat(this.form.get("message")?.value, this.dataService.selectedAgent.value.id);
            this.form.reset();
            this.form.enable();
        }
    }


}