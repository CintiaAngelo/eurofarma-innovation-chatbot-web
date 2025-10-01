// src/app/admin/admin.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ChatbotService } from '../../services/chatbot.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './admin.html',
  styleUrls: ['./admin.css']
})
export class AdminComponent implements OnInit {
  activeTab = 'newsletters';
  newsletters: any[] = [];
  ideas: any[] = [];
  filteredIdeas: any[] = [];
  
  filterStatus = '';
  sortOrder = 'data-desc';
  
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  paginatedIdeas: any[] = [];
  
  analytics = {
    totalIdeas: 0,
    implementedIdeas: 0,
    pointsDistributed: 0,
    implementationRate: 0,
    ideasByDepartment: [] as any[],
    ideasByStatus: [] as any[],
    ideasByMonth: [] as any[],
    topEmployees: [] as any[],
    activeUsers: [] as any[],
    activeDepts: [] as any[],
    avgImplementationTime: 0,
    topEmployee: null as any
  };

  newNewsletter = {
    titulo: '',
    conteudo: ''
  };

  showModal = false;
  modalIdea: any = null;
  isEditing = false;
  ideaStatuses = ['Submetida', 'Em análise', 'Aprovada', 'Implementada'];

  constructor(private chatbotService: ChatbotService) { }

  ngOnInit(): void {
    this.loadNewsletters();
    this.loadAnalyticsData();
  }

  selectTab(tab: string): void {
    this.activeTab = tab;
    if (tab === 'newsletters') {
      this.loadNewsletters();
    } else if (tab === 'ideas') {
      this.loadIdeas();
    }
  }

  loadNewsletters(): void {
    this.chatbotService.getNewsletters().subscribe({
        next: (data) => {
            this.newsletters = data;
        },
        error: (err) => {
            console.error('Erro ao buscar newsletters:', err);
        }
    });
  }

  loadIdeas(): void {
    this.chatbotService.getIdeas().subscribe({
        next: (data) => {
            this.ideas = data;
            this.totalItems = this.ideas.length;
            this.applyFiltersAndSort();
        },
        error: (err) => {
            console.error('Erro ao buscar ideias:', err);
        }
    });
  }
  
  applyFiltersAndSort(): void {
    let tempIdeas = [...this.ideas];

    if (this.filterStatus && this.filterStatus !== 'todos') {
      tempIdeas = tempIdeas.filter(idea => idea.status_ideia === this.filterStatus);
    }

    if (this.sortOrder === 'data-desc') {
      tempIdeas.sort((a, b) => new Date(b.data_submissao).getTime() - new Date(a.data_submissao).getTime());
    } else if (this.sortOrder === 'data-asc') {
      tempIdeas.sort((a, b) => new Date(a.data_submissao).getTime() - new Date(b.data_submissao).getTime());
    } else if (this.sortOrder === 'departamento') {
      tempIdeas.sort((a, b) => a.departamento.localeCompare(b.departamento));
    }

    this.filteredIdeas = tempIdeas;
    this.totalItems = this.filteredIdeas.length;
    this.currentPage = 1;
    this.updatePaginatedIdeas();
  }
  
  updatePaginatedIdeas(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedIdeas = this.filteredIdeas.slice(startIndex, endIndex);
  }
  
  goToPage(pageNumber: number): void {
    this.currentPage = pageNumber;
    this.updatePaginatedIdeas();
  }
  
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedIdeas();
    }
  }
  
  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedIdeas();
    }
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }
  
  get visiblePages(): number[] {
    const pages = [];
    const total = this.totalPages;
    for (let i = 1; i <= total; i++) {
        pages.push(i);
    }
    return pages;
  }
  
  updateIdeaStatus(idea: any): void {
    this.chatbotService.updateIdea(idea).subscribe({
      next: () => {
        alert('Status da ideia atualizado com sucesso!');
      },
      error: (err) => {
        console.error('Erro ao atualizar status da ideia:', err);
        alert('Erro ao atualizar status. Tente novamente.');
      }
    });
  }

  viewIdea(idea: any): void {
    this.modalIdea = { ...idea };
    this.isEditing = false;
    this.showModal = true;
  }

  editIdea(idea: any): void {
    this.modalIdea = { ...idea };
    this.isEditing = true;
    this.showModal = true;
  }
  
  saveModalIdea(): void {
    if (this.modalIdea) {
      this.chatbotService.updateIdea(this.modalIdea).subscribe({
        next: () => {
          alert('Ideia atualizada com sucesso!');
          this.loadIdeas();
          this.closeModal();
        },
        error: (err) => {
          console.error('Erro ao salvar a ideia:', err);
          alert('Erro ao salvar as alterações. Tente novamente.');
        }
      });
    }
  }
  
  openNewsletterModal(): void {
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.modalIdea = null;
    this.isEditing = false;
  }

  onSubmitNewsletter(): void {
    this.chatbotService.sendNewsletter(this.newNewsletter).subscribe({
        next: (response) => {
            alert(response.message);
            this.closeModal();
            this.loadNewsletters();
        },
        error: (err) => {
            console.error('Erro ao enviar a newsletter:', err);
            alert('Erro ao enviar a newsletter.');
        }
    });
  }

  loadAnalyticsData(): void {
    // Dados principais do dashboard
    this.chatbotService.getAnalyticsDashboard().subscribe({
      next: (data) => {
        this.analytics = { ...this.analytics, ...data };
      },
      error: (err) => {
        console.error('Erro ao buscar dados de analytics:', err);
      }
    });

    // Métricas de engajamento
    this.chatbotService.getEngagementMetrics().subscribe({
      next: (data) => {
        this.analytics.activeUsers = data.activeUsers;
        this.analytics.activeDepts = data.activeDepts;
        this.analytics.avgImplementationTime = data.avgImplementationTime;
      },
      error: (err) => {
        console.error('Erro ao buscar métricas de engajamento:', err);
      }
    });

    // Funcionário top (mantido para compatibilidade)
    this.chatbotService.getTopEmployee().subscribe({
      next: (data) => {
        this.analytics.topEmployee = data;
      },
      error: (err) => {
        console.error('Erro ao buscar funcionário com mais pontos:', err);
      }
    });

  }
  getStatusColor(status: string): string {
  const colors: { [key: string]: string } = {
    'Submetida': '#FFDB57',
    'Em análise': '#11296B', 
    'Aprovada': '#00274C',
    'Implementada': '#166534',
    'Recebida': '#92400E'
  };
  return colors[status] || '#6B7280';
}

getMaxMonthlyIdeas(): number {
  if (!this.analytics.ideasByMonth.length) return 1;
  return Math.max(...this.analytics.ideasByMonth.map(m => m.count));
}

}