import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatbotService {
  private readonly API_URL = 'http://localhost:3000/api';

  constructor(private http: HttpClient) { }

  getInitialMessage(): Observable<any> {
    return this.http.get(`${this.API_URL}/chatbot/init`);
  }

  getNextStep(currentStepId: string, userResponse: string, collectedData: any): Observable<any> {
    return this.http.post(`${this.API_URL}/chatbot/next-step`, { currentStepId, userResponse, collectedData });
  }

  submitIdea(ideaData: any): Observable<any> {
    return this.http.post(`${this.API_URL}/ideas`, ideaData);
  }

  getNewsletters(): Observable<any> {
    return this.http.get(`${this.API_URL}/newsletters`);
  }

  getIdeas(): Observable<any> {
    return this.http.get(`${this.API_URL}/ideas`);
  }

  updateIdea(ideaData: any): Observable<any> {
    return this.http.put(`${this.API_URL}/ideas/${ideaData.id_ideia}`, ideaData);
  }

  sendNewsletter(newsletter: any): Observable<any> {
    return this.http.post(`${this.API_URL}/newsletter`, newsletter);
  }

  getTopEmployee(): Observable<any> {
    return this.http.get(`${this.API_URL}/gamification/top-employee`);
  }

getAnalyticsDashboard(): Observable<any> {
  return this.http.get(`${this.API_URL}/analytics/dashboard`);
}

getEngagementMetrics(): Observable<any> {
  return this.http.get(`${this.API_URL}/analytics/engagement`);
}

}
