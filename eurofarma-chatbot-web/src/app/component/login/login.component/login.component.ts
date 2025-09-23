// src/app/component/login/login.component.ts

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginData = {
    email: '',
    password: ''
  };

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit(): void {
    // A chamada para o serviço de autenticação deve ser feita aqui.
    // O redirecionamento para a página do chat (/) é o comportamento esperado.
    this.authService.login(this.loginData.email, this.loginData.password).subscribe({
      next: (response) => {
        // Redireciona para a página principal do chatbot
        this.router.navigate(['/chat']);
      },
      error: (err) => {
        console.error('Erro de login:', err);
        alert('Falha no login. Verifique seu e-mail e senha.');
      }
    });
  }
}