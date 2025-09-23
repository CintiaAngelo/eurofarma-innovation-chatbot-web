// src/app/component/chatbot/chatbot.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ChatbotService } from '../../../services/chatbot.service';
import { AuthService } from '../../../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.css']
})
export class ChatbotComponent implements OnInit, OnDestroy {
  isUserAdmin: boolean = false;
  chatMessages: any[] = [];
  userInput = '';
  private authSubscription: Subscription = new Subscription();

  constructor(
    private chatbotService: ChatbotService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authSubscription = this.authService.isAdmin$.subscribe(isAdmin => {
      this.isUserAdmin = isAdmin;
    });
    this.loadInitialMessages();
  }
  
  ngOnDestroy(): void {
    this.authSubscription.unsubscribe();
  }

  loadInitialMessages(): void {
    this.chatbotService.getInitialMessage().subscribe({
      next: response => {
        this.addBotMessage(response.message);
        if (response.newsletter) {
            this.addBotMessage(response.newsletter.conteudo_clob);
        }
        if (response.prompt_idea) {
            this.addBotMessage(response.prompt_idea, [response.button_text]);
        }
      },
      error: error => {
        console.error('Erro ao buscar a mensagem inicial:', error);
        this.addBotMessage('Erro ao conectar com o assistente. Por favor, tente novamente mais tarde.');
      }
    });
  }

  handleUserInput(): void {
    const message = this.userInput.trim();
    if (message) {
      this.addUserMessage(message);
      this.userInput = '';
      
      const typingIndicator = this.showTypingIndicator();
      
      setTimeout(() => {
        this.removeMessage(typingIndicator);
        this.addBotMessage("Obrigado pelo seu interesse! Para enviar uma ideia, clique no botão 'Enviar minha ideia' acima.");
      }, 1500);
    }
  }

  addBotMessage(text: string, options?: string[]): void {
    this.chatMessages.push({ sender: 'bot', text, options });
  }

  addUserMessage(text: string): void {
    this.chatMessages.push({ sender: 'user', text });
  }

  showTypingIndicator(): any {
    const typingMessage = { sender: 'bot', text: 'Digitando...', isTyping: true };
    this.chatMessages.push(typingMessage);
    return typingMessage;
  }

  removeMessage(message: any): void {
    const index = this.chatMessages.indexOf(message);
    if (index > -1) {
      this.chatMessages.splice(index, 1);
    }
  }
}