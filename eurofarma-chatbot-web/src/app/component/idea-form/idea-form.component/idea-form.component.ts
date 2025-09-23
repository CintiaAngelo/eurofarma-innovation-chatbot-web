// src/app/component/idea-form/idea-form.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ChatbotService } from '../../../services/chatbot.service';
import { AuthService } from '../../../services/auth.service'; // Se necessário para lógica de autenticação

@Component({
  selector: 'app-idea-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './idea-form.component.html',
  styleUrls: ['./idea-form.component.css']
})
export class IdeaFormComponent implements OnInit {
  currentStep = 1;
  progressBarWidth = 25;
  formData: any = {
    name: '',
    email: '',
    phone: '',
    department: '',
    ideaTitle: '',
    ideaDescription: ''
  };
  success = false;

  constructor(
    private chatbotService: ChatbotService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Lógica para pré-popular o formulário se o usuário estiver logado
    // Exemplo:
    // if (this.authService.isLogged) {
    //   this.formData.name = this.authService.userName;
    //   this.formData.email = this.authService.userEmail;
    // }
  }

  nextStep(): void {
    if (this.currentStep === 1) {
      if (!this.formData.name || !this.formData.email || !this.formData.department) {
        alert('Por favor, preencha todos os campos obrigatórios.');
        return;
      }
    } else if (this.currentStep === 2) {
      if (!this.formData.ideaTitle || !this.formData.ideaDescription) {
        alert('Por favor, preencha todos os campos da ideia.');
        return;
      }
    }
    this.currentStep++;
    this.updateProgressBar();
  }

  prevStep(): void {
    this.currentStep--;
    this.updateProgressBar();
  }

  updateProgressBar(): void {
    this.progressBarWidth = (this.currentStep / 3) * 100;
  }

  onSubmit(): void {
    this.chatbotService.submitIdea(this.formData).subscribe({
      next: (response: any) => {
        this.success = true;
        this.currentStep = 4;
        this.updateProgressBar();
      },
      error: (error) => {
        const errorMessage = error.error?.error || 'Erro ao enviar a ideia. Tente novamente.';
        alert(errorMessage);
        console.error('Erro:', error);
      }
    });
  }

  resetForm(): void {
    this.currentStep = 1;
    this.progressBarWidth = 25;
    this.formData = {
      name: '',
      email: '',
      phone: '',
      department: '',
      ideaTitle: '',
      ideaDescription: ''
    };
    this.success = false;
  }
}