// src/app/admin/admin.component.ts
import { Component, OnInit, AfterViewInit } from '@angular/core';
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
export class AdminComponent implements OnInit, AfterViewInit {
  activeTab = 'newsletters';
  newsletters: any[] = [];
  ideas: any[] = [];
  filteredIdeas: any[] = [];
  newsletterPreview = '';
  today = new Date();
  
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
    totalInteractions: 0,
    uniqueUsers: 0,
    pointsHistory: [] as any[],
    pointsByType: [] as any[],
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
  isLoadingAnalytics = false;

  constructor(private chatbotService: ChatbotService) { }

  ngOnInit(): void {
    console.log('AdminComponent inicializado');
    this.loadNewsletters();
    this.loadAnalyticsData();
    
    // Debug após um breve delay
    setTimeout(() => {
      this.checkTabVisibility();
      this.testServiceConnection();
    }, 1000);
  }

  ngAfterViewInit(): void {
    this.initializeIcons();
  }

  private initializeIcons(): void {
    console.log('Componente admin carregado - ícones prontos para uso');
  }

  // ========== TAB MANAGEMENT ==========
  selectTab(tab: string): void {
    this.activeTab = tab;
    console.log('Tab selecionada:', tab);
    
    if (tab === 'newsletters') {
      this.loadNewsletters();
    } else if (tab === 'ideas') {
      this.loadIdeas();
    } else if (tab === 'analytics') {
      this.loadAnalyticsData();
    }
  }

  // ========== NEWSLETTERS FUNCTIONS ==========
  loadNewsletters(): void {
    console.log('Carregando newsletters...');
    this.chatbotService.getNewsletters().subscribe({
      next: (data) => {
        this.newsletters = data.map((item: any) => ({
          ...item,
          status_envio: item.status_envio || 'Pendente',
          data_envio_programada: item.data_envio_programada || item.data_criacao || new Date().toISOString(),
          conteudo: item.conteudo || item.conteudo_clob || item.descricao || ''
        }));
        console.log('Newsletters carregadas:', this.newsletters.length);
      },
      error: (err) => {
        console.error('Erro ao buscar newsletters:', err);
        alert('Erro ao carregar newsletters. Verifique o console para mais detalhes.');
      }
    });
  }

  formatNewsletterDate(dateString: string): string {
    if (!dateString) return 'Data não definida';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Data inválida';
      }
      
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return 'Data inválida';
    }
  }

  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'sent': 'Enviada',
      'pending': 'Pendente',
      'failed': 'Falha',
      'Enviada': 'Enviada',
      'Pendente': 'Pendente',
      'Falha': 'Falha',
      'Enviado': 'Enviada',
      'pendente': 'Pendente'
    };
    
    return statusMap[status] || status || 'Pendente';
  }

  getStatusClass(status: string): string {
    const statusLower = status?.toLowerCase() || 'pending';
    
    if (statusLower.includes('envia') || statusLower === 'sent' || statusLower === 'enviado') {
      return 'status-sent';
    } else if (statusLower.includes('falha') || statusLower === 'failed') {
      return 'status-failed';
    } else {
      return 'status-pending';
    }
  }

  editNewsletterDescription(newsletter: any): void {
    const newDescription = prompt('Editar descrição da newsletter:', newsletter.conteudo || newsletter.conteudo_clob || newsletter.descricao || '');
    
    if (newDescription !== null && newDescription !== newsletter.conteudo) {
      this.updateNewsletterDescription(newsletter.id_newsletter, newDescription);
    }
  }

  updateNewsletterDescription(id: number, newDescription: string): void {
    this.chatbotService.updateNewsletterDescription(id, newDescription).subscribe({
      next: (response) => {
        alert('Descrição atualizada com sucesso!');
        this.loadNewsletters();
      },
      error: (err) => {
        console.error('Erro ao atualizar descrição:', err);
        this.tryAlternativeUpdate(id, newDescription);
      }
    });
  }

  private tryAlternativeUpdate(id: number, description: string): void {
    this.chatbotService.getNewsletters().subscribe({
      next: (newsletters) => {
        const newsletterToUpdate = newsletters.find((n: any) => n.id_newsletter === id);
        if (newsletterToUpdate) {
          const updatedNewsletter = {
            ...newsletterToUpdate,
            conteudo: description,
            conteudo_clob: description
          };
          
          this.chatbotService.updateNewsletter(updatedNewsletter).subscribe({
            next: () => {
              alert('Descrição atualizada com sucesso!');
              this.loadNewsletters();
            },
            error: (err) => {
              console.error('Erro alternativo ao atualizar:', err);
              alert('Erro ao atualizar a descrição. Tente novamente.');
            }
          });
        }
      },
      error: (err) => {
        console.error('Erro ao buscar newsletter:', err);
        alert('Erro ao atualizar a descrição.');
      }
    });
  }

  deleteNewsletter(newsletter: any): void {
    const confirmDelete = confirm(`Tem certeza que deseja apagar a newsletter "${newsletter.titulo}"?\n\nEsta ação não pode ser desfeita.`);
    
    if (confirmDelete) {
      this.chatbotService.deleteNewsletter(newsletter.id_newsletter).subscribe({
        next: (response) => {
          alert('Newsletter apagada com sucesso!');
          this.loadNewsletters();
        },
        error: (err) => {
          console.error('Erro ao apagar newsletter:', err);
          alert('Erro ao apagar a newsletter. Tente novamente.');
        }
      });
    }
  }

  resendNewsletter(newsletter: any): void {
    const confirmResend = confirm(`Deseja reenviar a newsletter "${newsletter.titulo}" para o chatbot?`);
    
    if (confirmResend) {
      const originalText = newsletter.status_envio;
      newsletter.status_envio = 'Enviando...';
      
      this.chatbotService.resendNewsletter(newsletter.id_newsletter).subscribe({
        next: (response) => {
          alert('Newsletter reenviada com sucesso!');
          this.loadNewsletters();
        },
        error: (err) => {
          console.error('Erro ao reenviar newsletter:', err);
          alert('Erro ao reenviar a newsletter. Tente novamente.');
          newsletter.status_envio = originalText;
        }
      });
    }
  }

  openNewsletterModal(): void {
    this.newNewsletter = { titulo: '', conteudo: '' };
    this.newsletterPreview = '';
    this.isEditing = false;
    this.modalIdea = null;
    this.showModal = true;
  }

  onSubmitNewsletter(): void {
    console.log('Enviando newsletter:', this.newNewsletter);
    
    if (!this.newNewsletter.titulo || !this.newNewsletter.conteudo) {
      alert('Por favor, preencha o título e o conteúdo da newsletter.');
      return;
    }

    const formattedNewsletter = {
      titulo: this.newNewsletter.titulo,
      conteudo: this.formatNewsletterContent(this.newNewsletter.conteudo)
    };
    
    this.chatbotService.sendNewsletter(formattedNewsletter).subscribe({
      next: (response) => {
        alert('Newsletter enviada com sucesso!');
        this.closeModal();
        this.loadNewsletters();
      },
      error: (err) => {
        console.error('Erro ao enviar a newsletter:', err);
        alert('Erro ao enviar a newsletter. Tente novamente.');
      }
    });
  }

  private formatNewsletterContent(content: string): string {
    if (!content) return '';
    
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  }

  updateNewsletterPreview(): void {
    if (this.newNewsletter.conteudo) {
      this.newsletterPreview = this.newNewsletter.conteudo
        .replace(/\n/g, '<br>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>');
    } else {
      this.newsletterPreview = '';
    }
  }

  // ========== IDEAS FUNCTIONS ==========
  loadIdeas(): void {
    console.log('Carregando ideias...');
    this.chatbotService.getIdeas().subscribe({
      next: (data) => {
        this.ideas = data;
        this.totalItems = this.ideas.length;
        console.log('Ideias carregadas:', this.ideas.length);
        this.applyFiltersAndSort();
      },
      error: (err) => {
        console.error('Erro ao buscar ideias:', err);
        alert('Erro ao carregar ideias. Verifique o console para mais detalhes.');
      }
    });
  }
  
  applyFiltersAndSort(): void {
    console.log('Aplicando filtros e ordenação...');
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
    console.log('Ideias paginadas:', this.paginatedIdeas.length);
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
      console.log('Salvando ideia:', this.modalIdea);
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

  updateIdeaStatus(idea: any): void {
    this.chatbotService.updateIdea(idea).subscribe({
      next: () => {
        console.log('Status da ideia atualizado:', idea.status_ideia);
      },
      error: (err) => {
        console.error('Erro ao atualizar status da ideia:', err);
        alert('Erro ao atualizar o status. Tente novamente.');
      }
    });
  }

  // ========== ANALYTICS FUNCTIONS ==========
  loadAnalyticsData(): void {
    console.log('Carregando dados de analytics...');
    
    this.analytics = {
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
      totalInteractions: 0,
      uniqueUsers: 0,
      pointsHistory: [] as any[],
      pointsByType: [] as any[],
      topEmployee: null as any
    };

    this.chatbotService.getAnalyticsDashboard().subscribe({
      next: (data) => {
        console.log('Dados recebidos do dashboard:', data);
        this.analytics = { ...this.analytics, ...data };
      },
      error: (err) => {
        console.error('Erro detalhado ao buscar dados de analytics:', err);
      }
    });

    this.chatbotService.getEngagementMetrics().subscribe({
      next: (data) => {
        console.log('Dados de engajamento recebidos:', data);
        this.analytics.activeUsers = data.activeUsers;
        this.analytics.activeDepts = data.activeDepts;
        this.analytics.totalInteractions = data.totalInteractions;
        this.analytics.uniqueUsers = data.uniqueUsers;
      },
      error: (err) => {
        console.error('Erro ao buscar métricas de engajamento:', err);
      }
    });

    this.chatbotService.getPointsHistory().subscribe({
      next: (data) => {
        console.log('Dados de pontos recebidos:', data);
        this.analytics.pointsHistory = data.pointsHistory;
        this.analytics.pointsByType = data.pointsByType;
      },
      error: (err) => {
        console.error('Erro ao buscar histórico de pontos:', err);
      }
    });

    this.chatbotService.getTopEmployee().subscribe({
      next: (data) => {
        console.log('Top employee recebido:', data);
        this.analytics.topEmployee = data;
      },
      error: (err) => {
        console.error('Erro ao buscar funcionário com mais pontos:', err);
      }
    });
  }

  refreshAnalytics(): void {
    console.log('Forçando refresh dos analytics...');
    this.isLoadingAnalytics = true;
    
    this.analytics = {
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
      totalInteractions: 0,
      uniqueUsers: 0,
      pointsHistory: [] as any[],
      pointsByType: [] as any[],
      topEmployee: null
    };
    
    setTimeout(() => {
      this.loadAnalyticsData();
      this.isLoadingAnalytics = false;
    }, 500);
  }

  hardRefresh(): void {
    console.log('Recarregando página...');
    location.reload();
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'Submetida': '#FFDB57',
      'Em análise': '#11296B', 
      'Aprovada': '#00274C',
      'Implementada': '#166534'
    };
    return colors[status] || '#6B7280';
  }

  getMaxMonthlyIdeas(): number {
    if (!this.analytics.ideasByMonth || !this.analytics.ideasByMonth.length) return 1;
    return Math.max(...this.analytics.ideasByMonth.map(m => m.count));
  }

  getMaxMonthlyPoints(): number {
    if (!this.analytics.pointsHistory || !this.analytics.pointsHistory.length) return 1;
    return Math.max(...this.analytics.pointsHistory.map(m => m.total_points));
  }

  formatMonthLabel(monthString: string): string {
    try {
      const [year, month] = monthString.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return date.toLocaleDateString('pt-BR', { month: 'short' });
    } catch (error) {
      return monthString;
    }
  }

  getRankClass(rank: number): string {
    switch(rank) {
      case 1: return 'rank-gold';
      case 2: return 'rank-silver';
      case 3: return 'rank-bronze';
      default: return 'rank-other';
    }
  }

  // ========== MODAL FUNCTIONS ==========
  closeModal(): void {
    this.showModal = false;
    this.modalIdea = null;
    this.isEditing = false;
    this.newNewsletter = { titulo: '', conteudo: '' };
  }

  // ========== DEBUG & TEST FUNCTIONS ==========
  checkTabVisibility(): void {
    console.log('=== DEBUG TAB VISIBILITY ===');
    console.log('Tab ativa:', this.activeTab);
    console.log('Newsletters carregadas:', this.newsletters.length);
    console.log('Ideias carregadas:', this.ideas.length);
    console.log('Analytics carregados:', this.analytics);
  }

  testServiceConnection(): void {
    console.log('=== TESTANDO CONEXÃO COM O SERVIÇO ===');
    
    this.chatbotService.healthCheck().subscribe({
      next: (response) => {
        console.log('✅ Servidor online:', response);
      },
      error: (err) => {
        console.error('❌ Servidor offline:', err);
      }
    });
  }

  testAllNewsletterOperations(): void {
    console.log('=== TESTANDO TODAS AS OPERAÇÕES DE NEWSLETTER ===');
    
    const testNewsletter = {
      titulo: 'Teste - ' + new Date().toLocaleTimeString(),
      conteudo: 'Esta é uma newsletter de teste enviada em ' + new Date().toLocaleString()
    };
    
    this.chatbotService.sendNewsletter(testNewsletter).subscribe({
      next: (response) => {
        console.log('✅ Newsletter enviada:', response);
        this.loadNewsletters();
      },
      error: (err) => {
        console.error('❌ Erro ao enviar newsletter:', err);
      }
    });
  }

  forceReloadNewsletters(): void {
    console.log('Forçando recarregamento de newsletters...');
    this.newsletters = [];
    setTimeout(() => {
      this.loadNewsletters();
    }, 100);
  }

  forceTabLoad(tab: string): void {
    console.log('Forçando carregamento da tab:', tab);
    this.activeTab = tab;
    
    setTimeout(() => {
      switch(tab) {
        case 'newsletters':
          this.loadNewsletters();
          break;
        case 'ideas':
          this.loadIdeas();
          break;
        case 'analytics':
          this.loadAnalyticsData();
          break;
      }
    }, 50);
  }
}