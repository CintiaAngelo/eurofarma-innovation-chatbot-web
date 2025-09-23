// src/services/auth.service.ts

import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private _isLogged = new BehaviorSubject<boolean>(false);
  private _isAdmin = new BehaviorSubject<boolean>(false);

  public readonly isLogged$ = this._isLogged.asObservable();
  public readonly isAdmin$ = this._isAdmin.asObservable();

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.checkLoginStatus();
  }

  private checkLoginStatus(): void {
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('authToken');
      const role = localStorage.getItem('userRole');
      if (token) {
        this._isLogged.next(true);
        if (role === 'admin') {
          this._isAdmin.next(true);
        }
      }
    }
  }

  login(email: string, password: string): Observable<any> {
    if (email === 'henrique.mosseri@eurofarma.com' && password === '552240') {
      const mockResponse = { token: 'mock-admin-token', role: 'admin' };
      
      return of(mockResponse).pipe(
        tap(() => {
          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('authToken', mockResponse.token);
            localStorage.setItem('userRole', mockResponse.role);
          }
          this._isLogged.next(true);
          this._isAdmin.next(true);
        })
      );
    } else if (email === 'henrique.mosseri@fiap.com' && password === '552240') {
      const mockResponse = { token: 'mock-user-token', role: 'user' };

      return of(mockResponse).pipe(
        tap(() => {
          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('authToken', mockResponse.token);
            localStorage.setItem('userRole', mockResponse.role);
          }
          this._isLogged.next(true);
          this._isAdmin.next(false);
        })
      );
    } else {
      return throwError(() => new Error('Credenciais inválidas.'));
    }
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userRole');
    }
    this._isLogged.next(false);
    this._isAdmin.next(false);
  }

  get isLogged(): boolean {
    return this._isLogged.value;
  }

  get isAdmin(): boolean {
    return this._isAdmin.value;
  }
}