import { Component } from '@angular/core';
import { DataService } from '../../services/data.service';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'login-component',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatInputModule,
    MatButtonModule,
    TranslatePipe
  ]
})
export class LoginComponent {

  form: FormGroup;

  constructor(
    private dataService: DataService,
    private router: Router
  ) {
    this.form = new FormGroup({
      username: new FormControl('', Validators.required),
      password: new FormControl('', Validators.required)
    });
  }

  ngOnInit() {
    if (this.dataService.isLoggedIn) {
      this.router.navigate(['/chat'])
    }
  }

  async login() {
    if (this.form.valid) {
      this.form.disable();
      const res = await this.dataService.login(this.form.get("username")?.value, this.form.get("password")?.value);
      this.form.enable();
    }
  }
}