// src/app/services/chatbot.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatbotService {
  private readonly API_URL = 'http://localhost:3000/api';
  
  // Headers para evitar cache
  private readonly noCacheHeaders = new HttpHeaders({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });

  constructor(private http: HttpClient) { }

  // ========== CHATBOT METHODS ==========
  getInitialMessage(): Observable<any> {
    return this.http.get(`${this.API_URL}/chatbot/init`, { 
      headers: this.noCacheHeaders 
    });
  }

  // Método alternativo para compatibilidade
  getChatbotInit(): Observable<any> {
    return this.getInitialMessage();
  }

  getNextStep(currentStepId: string, userResponse: string, collectedData: any): Observable<any> {
    return this.http.post(`${this.API_URL}/chatbot/next-step`, { 
      currentStepId, userResponse, collectedData 
    }, { 
      headers: this.noCacheHeaders 
    });
  }

  submitIdea(ideaData: any): Observable<any> {
    return this.http.post(`${this.API_URL}/ideas`, ideaData, { 
      headers: this.noCacheHeaders 
    });
  }

  // ========== NEWSLETTER METHODS ==========
  getNewsletters(): Observable<any> {
    return this.http.get(`${this.API_URL}/newsletters`, { 
      headers: this.noCacheHeaders 
    });
  }

  sendNewsletter(newsletter: any): Observable<any> {
    console.log('Enviando newsletter:', newsletter);
    return this.http.post(`${this.API_URL}/newsletter`, newsletter, { 
      headers: this.noCacheHeaders 
    });
  }

  updateNewsletterDescription(id: number, description: string): Observable<any> {
    return this.http.put(`${this.API_URL}/newsletters/${id}/description`, 
      { description }, 
      { headers: this.noCacheHeaders }
    );
  }

  deleteNewsletter(id: number): Observable<any> {
    return this.http.delete(`${this.API_URL}/newsletters/${id}`, { 
      headers: this.noCacheHeaders 
    });
  }

  resendNewsletter(id: number): Observable<any> {
    return this.http.post(`${this.API_URL}/newsletters/${id}/resend`, 
      {}, 
      { headers: this.noCacheHeaders }
    );
  }

  updateNewsletter(newsletter: any): Observable<any> {
    return this.http.put(`${this.API_URL}/newsletters/${newsletter.id_newsletter}`, 
      newsletter, 
      { headers: this.noCacheHeaders }
    );
  }

  // ========== IDEAS METHODS ==========
  getIdeas(): Observable<any> {
    return this.http.get(`${this.API_URL}/ideas`, { 
      headers: this.noCacheHeaders 
    });
  }

  updateIdea(ideaData: any): Observable<any> {
    return this.http.put(`${this.API_URL}/ideas/${ideaData.id_ideia}`, 
      ideaData, 
      { headers: this.noCacheHeaders }
    );
  }

  // ========== ANALYTICS METHODS ==========
  getAnalyticsDashboard(): Observable<any> {
    return this.http.get(`${this.API_URL}/analytics/dashboard`, { 
      headers: this.noCacheHeaders 
    });
  }

  getEngagementMetrics(): Observable<any> {
    return this.http.get(`${this.API_URL}/analytics/engagement`, { 
      headers: this.noCacheHeaders 
    });
  }

  getPointsHistory(): Observable<any> {
    return this.http.get(`${this.API_URL}/analytics/points-history`, { 
      headers: this.noCacheHeaders 
    });
  }

  getTopEmployee(): Observable<any> {
    return this.http.get(`${this.API_URL}/gamification/top-employee`, { 
      headers: this.noCacheHeaders 
    });
  }

  // ========== HEALTH CHECK ==========
  healthCheck(): Observable<any> {
    return this.http.get(`${this.API_URL}/health`, { 
      headers: this.noCacheHeaders 
    });
  }
}