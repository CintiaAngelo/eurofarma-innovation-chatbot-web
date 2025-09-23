// src/app/component/header/header.component.ts

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router'; // Importe o Router
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  constructor(public authService: AuthService, private router: Router) {} // Injete o Router

  // Novo método para lidar com o logout e o redirecionamento
  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']); // Redireciona para a página de login
  }
}