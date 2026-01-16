import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { DataService } from '../../services/data.service';
import { User } from '../../interfaces/user.interface';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
    selector: 'app-admin-users',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatTableModule,
        MatButtonModule,
        MatIconModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        TranslatePipe
    ],
    templateUrl: './admin-users.component.html',
    styleUrls: ['./admin-users.component.scss']
})
export class AdminUsersComponent implements OnInit {
    users: User[] = [];
    displayedColumns: string[] = ['username', 'email', 'role', 'actions'];
    userForm: FormGroup;
    message: string = '';
    error: string = '';

    constructor(private dataService: DataService) {
        this.userForm = new FormGroup({
            username: new FormControl('', Validators.required),
            email: new FormControl('', [Validators.required, Validators.email]),
            password: new FormControl('', [Validators.required, Validators.minLength(4)]),
            role: new FormControl('USER', Validators.required)
        });
    }

    ngOnInit(): void {
        this.loadUsers();
    }

    async loadUsers() {
        const res: any = await this.dataService.getAllUsers();
        if (res.error) {
            this.error = res.error;
        } else {
            this.users = res;
        }
    }

    async createUser() {
        if (this.userForm.invalid) return;
        this.message = '';
        this.error = '';
        const { username, password, email, role } = this.userForm.value;
        const res: any = await this.dataService.adminCreateUser(username, password, email, role);
        if (res.error) {
            this.error = res.error;
        } else {
            this.message = 'User created successfully';
            this.userForm.reset({ role: 'USER' });
            this.loadUsers();
        }
    }

    async deleteUser(id: string) {
        if (!confirm('Are you sure you want to delete this user?')) return;
        this.message = '';
        this.error = '';
        const res: any = await this.dataService.deleteUserById(id);
        if (res.error) {
            this.error = res.error;
        } else {
            this.message = 'User deleted successfully';
            this.loadUsers();
        }
    }
}
