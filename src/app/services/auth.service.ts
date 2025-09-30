import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, of, catchError } from 'rxjs';
import { User, LoginRequest, LoginResponse, ValidateResponse } from '../interfaces/auth.interface';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = environment.apiUrl;
  private readonly TOKEN_KEY = 'access_token';
  private readonly USER_KEY = 'user_data';
  private readonly EMAIL_KEY = 'remembered_email';
  private readonly SESSION_KEY = 'session_data';
  private readonly LAST_ACTIVITY_KEY = 'last_activity';

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(private http: HttpClient) {
    this.initializeAuthState();
  }

  private initializeAuthState(): void {
    const token = this.getToken();
    const userData = this.getUserData();
    const sessionData = this.getSessionData();
    
    console.log('🔐 Inicializando estado de autenticación', {
      hasToken: !!token,
      hasUserData: !!userData,
      hasSessionData: !!sessionData,
      isOnline: navigator.onLine,
      isPWA: this.isPWAMode()
    });
    
    if (token && userData) {
      // Verificar si la sesión es válida para PWA
      if (this.isValidPWASession(sessionData)) {
        console.log('🔐 Sesión PWA válida, restaurando estado');
        this.currentUserSubject.next(userData);
        this.isAuthenticatedSubject.next(true);
        this.updateLastActivity();
        
        // Solo intentar validar token si hay conexión estable
        if (navigator.onLine) {
          // Para navegadores normales, ser más estricto con la validación
          if (!this.isPWAMode()) {
            console.log('🔐 Navegador normal, validación de token necesaria');
            // Esperar un poco antes de validar
            setTimeout(() => {
              this.validateTokenSilently();
            }, 1000);
          } else {
            console.log('🔐 PWA detectada, manteniendo sesión sin validación inmediata');
          }
        } else {
          console.log('🔐 Aplicación iniciada offline, manteniendo sesión');
        }
      } else {
        console.log('🔐 Sesión PWA inválida, cerrando sesión');
        this.logout();
      }
    } else {
      console.log('🔐 No hay token o datos de usuario');
    }
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/auth/login`, credentials)
      .pipe(
        tap(response => {
          this.setToken(response.access_token);
          this.setUserData(response.usuario);
          this.createPWASession();
          this.updateLastActivity();
          this.currentUserSubject.next(response.usuario);
          this.isAuthenticatedSubject.next(true);
        })
      );
  }

  validateToken(): Observable<ValidateResponse> {
    return this.http.get<ValidateResponse>(`${this.API_URL}/auth/validate`)
      .pipe(
        tap(response => {
          if (response.valid && response.user) {
            this.setUserData(response.user);
            this.currentUserSubject.next(response.user);
            this.isAuthenticatedSubject.next(true);
          } else {
            this.logout();
          }
        })
      );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.SESSION_KEY);
    localStorage.removeItem(this.LAST_ACTIVITY_KEY);
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  getUserData(): User | null {
    const userData = localStorage.getItem(this.USER_KEY);
    return userData ? JSON.parse(userData) : null;
  }

  private setUserData(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  rememberEmail(email: string): void {
    localStorage.setItem(this.EMAIL_KEY, email);
  }

  getRememberedEmail(): string | null {
    return localStorage.getItem(this.EMAIL_KEY);
  }

  forgetEmail(): void {
    localStorage.removeItem(this.EMAIL_KEY);
  }

  /**
   * Crear sesión PWA con duración extendida
   */
  private createPWASession(): void {
    const isPWA = this.isPWAMode();
    const sessionDuration = isPWA 
      ? (7 * 24 * 60 * 60 * 1000)  // 7 días para PWA instalada
      : (8 * 60 * 60 * 1000);      // 8 horas para navegador normal
    
    const sessionData = {
      createdAt: Date.now(),
      expiresAt: Date.now() + sessionDuration,
      isPWA: isPWA,
      version: '1.0'
    };
    
    console.log('🔐 Creando sesión', {
      isPWA,
      duration: isPWA ? '7 días' : '8 horas',
      expiresAt: new Date(sessionData.expiresAt).toISOString()
    });
    
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData));
  }

  /**
   * Verificar si la sesión PWA es válida
   */
  private isValidPWASession(sessionData: any): boolean {
    if (!sessionData) {
      console.log('🔐 No hay datos de sesión');
      return false;
    }
    
    const now = Date.now();
    const lastActivity = this.getLastActivity();
    const isPWADetected = this.isPWAMode();
    
    // Para PWA instalada, sesión más larga
    const maxInactivityPWA = 7 * 24 * 60 * 60 * 1000; // 7 días para PWA
    const maxInactivityBrowser = 2 * 60 * 60 * 1000; // 2 horas para navegador offline
    
    // Verificar si la sesión no ha expirado
    if (now > sessionData.expiresAt) {
      console.log('🔐 Sesión PWA expirada', {
        now: new Date(now).toISOString(),
        expiresAt: new Date(sessionData.expiresAt).toISOString()
      });
      return false;
    }
    
    // Si es PWA instalada o fue marcada como PWA cuando se creó, ser más permisivo
    const isPWASession = sessionData.isPWA || isPWADetected;
    const maxInactivity = isPWASession ? maxInactivityPWA : maxInactivityBrowser;
    
    // Para navegadores normales offline, ser más estricto
    if (!isPWASession && !navigator.onLine) {
      const offlineMaxInactivity = 30 * 60 * 1000; // 30 minutos offline para navegador
      if (lastActivity && (now - lastActivity) > offlineMaxInactivity) {
        console.log('🔐 Navegador offline por mucho tiempo, sesión inválida', {
          lastActivity: new Date(lastActivity).toISOString(),
          offlineTime: Math.round((now - lastActivity) / (60 * 1000)) + ' minutos'
        });
        return false;
      }
    }
    
    // Verificar inactividad general
    if (lastActivity && (now - lastActivity) > maxInactivity) {
      console.log('🔐 Sesión inactiva por mucho tiempo', {
        lastActivity: new Date(lastActivity).toISOString(),
        maxInactivity: maxInactivity / (60 * 60 * 1000) + ' horas',
        isPWASession
      });
      return false;
    }
    
    console.log('🔐 Sesión PWA válida', {
      isPWASession,
      timeUntilExpiry: Math.round((sessionData.expiresAt - now) / (60 * 60 * 1000)) + ' horas',
      lastActivity: lastActivity ? new Date(lastActivity).toISOString() : 'nunca'
    });
    
    return true;
  }

  /**
   * Detectar si la app está ejecutándose como PWA
   */
  private isPWAMode(): boolean {
    // Detectar si está en modo standalone (PWA instalada)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      console.log('🔐 PWA detectada: display-mode standalone');
      return true;
    }
    
    // Detectar si está en full-screen (otra forma de PWA)
    if (window.matchMedia('(display-mode: fullscreen)').matches) {
      console.log('🔐 PWA detectada: display-mode fullscreen');
      return true;
    }
    
    // Detectar por navigator.standalone (iOS Safari)
    if ('standalone' in window.navigator && (window.navigator as any).standalone) {
      console.log('🔐 PWA detectada: navigator.standalone');
      return true;
    }

    // Detectar por URL sin barra de navegación (aproximación)
    const isInWebAppiOS = window.navigator.userAgent.includes('iPhone') && 
                         !window.navigator.userAgent.includes('Safari');
    if (isInWebAppiOS) {
      console.log('🔐 PWA detectada: iOS Web App');
      return true;
    }
    
    // Para desarrollo, también considerar como PWA si tiene parámetro pwa=true
    const isDevelopmentPWA = window.location.search.includes('pwa=true') || 
                            window.location.hash.includes('pwa=true');
    if (isDevelopmentPWA) {
      console.log('🔐 PWA detectada: Modo desarrollo (pwa=true)');
      return true;
    }
    
    console.log('🔐 No es PWA, ejecutándose en navegador normal');
    return false;
  }

  /**
   * Actualizar timestamp de última actividad
   */
  private updateLastActivity(): void {
    localStorage.setItem(this.LAST_ACTIVITY_KEY, Date.now().toString());
  }

  /**
   * Obtener timestamp de última actividad
   */
  private getLastActivity(): number | null {
    const activity = localStorage.getItem(this.LAST_ACTIVITY_KEY);
    return activity ? parseInt(activity, 10) : null;
  }

  /**
   * Obtener datos de sesión
   */
  private getSessionData(): any {
    try {
      const sessionStr = localStorage.getItem(this.SESSION_KEY);
      return sessionStr ? JSON.parse(sessionStr) : null;
    } catch (error) {
      console.error('Error parsing session data:', error);
      return null;
    }
  }

  /**
   * Validación silenciosa de token en background
   */
  private validateTokenSilently(): void {
    // Solo validar si hay conexión
    if (!navigator.onLine) {
      console.log('🔐 Sin conexión, manteniendo sesión PWA sin validación');
      return;
    }
    
    // Agregar timeout y mejor manejo de errores
    this.validateToken().pipe(
      catchError(error => {
        console.log('🔐 Error en validación de token:', error);
        
        // Si hay error de conexión (500, 0, timeout, etc.), mantener sesión PWA
        const isConnectionError = !error.status || error.status === 0 || error.status >= 500;
        const sessionData = this.getSessionData();
        
        if (isConnectionError && this.isValidPWASession(sessionData)) {
          console.log('🔐 Error de conexión pero sesión PWA válida, manteniendo sesión offline');
          return of({ valid: true, user: this.getUserData() } as ValidateResponse);
        }
        
        // Si es error de autenticación (401, 403) y la sesión es válida, mantener por ahora
        if ((error.status === 401 || error.status === 403) && this.isValidPWASession(sessionData)) {
          console.log('🔐 Token expirado pero sesión PWA válida, manteniendo sesión offline');
          return of({ valid: true, user: this.getUserData() } as ValidateResponse);
        }
        
        // Solo cerrar sesión si es error definitivo y no hay sesión PWA válida
        console.log('🔐 Error definitivo y sin sesión PWA válida, cerrando sesión');
        this.logout();
        return of({ valid: false, user: null } as ValidateResponse);
      })
    ).subscribe({
      next: response => {
        if (response.valid && response.user) {
          this.setUserData(response.user);
          this.currentUserSubject.next(response.user);
          this.updateLastActivity();
        }
      },
      error: error => {
        console.error('🔐 Error inesperado en validación silenciosa:', error);
        // No cerrar sesión en errores inesperados si hay sesión PWA válida
        const sessionData = this.getSessionData();
        if (!this.isValidPWASession(sessionData)) {
          this.logout();
        }
      }
    });
  }

  /**
   * Método público para actualizar actividad (llamar en interacciones del usuario)
   */
  updateUserActivity(): void {
    if (this.isAuthenticated()) {
      this.updateLastActivity();
    }
  }

  /**
   * Verificar estado de sesión PWA
   */
  getPWASessionInfo(): any {
    const sessionData = this.getSessionData();
    const lastActivity = this.getLastActivity();
    
    return {
      isPWA: this.isPWAMode(),
      isValidSession: this.isValidPWASession(sessionData),
      sessionData,
      lastActivity: lastActivity ? new Date(lastActivity).toISOString() : null,
      timeUntilExpiry: sessionData ? Math.max(0, sessionData.expiresAt - Date.now()) : 0
    };
  }
}