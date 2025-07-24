import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { LoginRequest } from '../../interfaces/auth.interface';
import { ToastModule } from 'primeng/toast';
import { RippleModule } from 'primeng/ripple';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-auth',
  imports: [
    ReactiveFormsModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    CheckboxModule,
    ToastModule,
    ProgressSpinnerModule,
    RippleModule,
    CommonModule
  ],
  templateUrl: './auth.html',
  styleUrls: ['./auth.scss'],
    providers: [MessageService]
})
export class AuthComponent implements OnInit {
  loginForm!: FormGroup;
  loading = false;
  isDarkTheme = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private messageService: MessageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadRememberedEmail();
    // this.isDarkTheme = this.themeService.getCurrentTheme() === 'dark';
  }

  private initializeForm(): void {
    this.loginForm = this.fb.group({
      correo: ['', [Validators.required, Validators.email]],
      contrasena: ['', [Validators.required, Validators.minLength(6)]],
      rememberEmail: [false]
    });
  }

  private loadRememberedEmail(): void {
    const rememberedEmail = this.authService.getRememberedEmail();
    if (rememberedEmail) {
      this.loginForm.patchValue({
        correo: rememberedEmail,
        rememberEmail: true
      });
    }
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.loading = true;
      const credentials: LoginRequest = {
        correo: this.loginForm.value.correo,
        contrasena: this.loginForm.value.contrasena
      };

      this.authService.login(credentials).subscribe({
        next: (response) => {
          this.handleRememberEmail();
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: `Bienvenido, ${response.usuario.nombre}`
          });
          setTimeout(() => {
            this.router.navigate(['/dashboard']);
          }, 1000);
        },
        error: (error) => {
          this.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error?.message || 'Credenciales inválidas'
          });
        },
        complete: () => {
          this.loading = false;
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  private handleRememberEmail(): void {
    if (this.loginForm.value.rememberEmail) {
      this.authService.rememberEmail(this.loginForm.value.correo);
    } else {
      this.authService.forgetEmail();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  // toggleTheme(): void {
  //   this.themeService.toggleTheme();
  //   this.isDarkTheme = !this.isDarkTheme;
  // }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (field?.errors?.['required']) {
      return `${fieldName === 'correo' ? 'Email' : 'Contraseña'} es requerido`;
    }
    if (field?.errors?.['email']) {
      return 'Email inválido';
    }
    if (field?.errors?.['minlength']) {
      return 'La contraseña debe tener al menos 6 caracteres';
    }
    return '';
  }
}

