// src/app/component/idea-form/idea-form.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ChatbotService } from '../../../services/chatbot.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-idea-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
  termsAccepted = false;

  constructor(
    private chatbotService: ChatbotService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    console.log('IdeaFormComponent inicializado');
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
    console.log('Enviando dados do formulário:', this.formData);

    if (!this.termsAccepted) {
      alert('Você deve aceitar os termos de uso para enviar a ideia.');
      return;
    }

    this.chatbotService.submitIdea(this.formData).subscribe({
      next: (response: any) => {
        console.log('Resposta do servidor:', response);
        this.success = true;
        this.currentStep = 4;
        this.updateProgressBar();
      },
      error: (error) => {
        console.error('Erro completo:', error);
        const errorMessage = error.error?.error || error.message || 'Erro ao enviar a ideia. Tente novamente.';
        alert(errorMessage);
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
    this.termsAccepted = false;
    this.success = false;
  }

  goToChat(): void {
    this.router.navigate(['/']);
  }
}