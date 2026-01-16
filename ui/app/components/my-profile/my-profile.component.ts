import { Component } from '@angular/core';
import { DataService } from '../../services/data.service';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { User } from '../../interfaces/user.interface';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
    selector: 'my-profile-component',
    templateUrl: './my-profile.component.html',
    imports: [
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        CommonModule,
        TranslatePipe
    ],
    styleUrl: './my-profile.component.scss'
})
export class MyProfileComponent {
    form: FormGroup;
    constructor(
        public dataService: DataService
    ) {
        this.form = new FormGroup({
            username: new FormControl('', Validators.required),
            email: new FormControl('', Validators.required),
            role: new FormControl('')
        });
        this.form.disable();

        this.passwordForm = new FormGroup({
            password: new FormControl('', [Validators.required, Validators.minLength(4)])
        });
    }

    user: User | null = null;
    passwordForm: FormGroup;
    message: string = '';
    error: string = '';

    async ngOnInit() {
        this.user = await this.dataService.getUser() as User;
        this.form.get("username")?.setValue(this.user.username);
        this.form.get("email")?.setValue(this.user.email);
        this.form.get("role")?.setValue(this.user.role);
    }

    async updatePassword() {
        if (this.passwordForm.invalid) return;
        this.message = '';
        this.error = '';
        const res: any = await this.dataService.changePassword(this.passwordForm.value.password);
        if (res.error) {
            this.error = res.error;
        } else {
            this.message = 'Password updated successfully';
            this.passwordForm.reset();
        }
    }

    async deleteProfile() {
        await this.dataService.deleteUser();
        this.dataService.logout();
    }
}