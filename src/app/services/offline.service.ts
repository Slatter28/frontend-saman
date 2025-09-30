import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, fromEvent, merge, of, throwError } from 'rxjs';
import { map, startWith, catchError, switchMap } from 'rxjs/operators';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class OfflineService {
  private onlineStatus$ = new BehaviorSubject<boolean>(navigator.onLine);
  private pendingActions$ = new BehaviorSubject<any[]>([]);

  constructor(
    private http: HttpClient,
    private notificationService: NotificationService
  ) {
    // Escuchar cambios de conexión
    merge(
      fromEvent(window, 'online').pipe(map(() => true)),
      fromEvent(window, 'offline').pipe(map(() => false))
    ).pipe(
      startWith(navigator.onLine)
    ).subscribe(status => {
      const wasOffline = !this.onlineStatus$.value;
      this.onlineStatus$.next(status);
      
      if (status) {
        if (wasOffline) {
          this.notificationService.showOnlineSuccess();
        }
        this.processPendingActions();
      } else {
        this.notificationService.showOfflineWarning();
      }
    });

    // Cargar acciones pendientes del localStorage
    this.loadPendingActions();
  }

  /**
   * Observable que indica si hay conexión a internet
   */
  get isOnline$(): Observable<boolean> {
    return this.onlineStatus$.asObservable();
  }

  /**
   * Getter sincrónico del estado de conexión
   */
  get isOnline(): boolean {
    return this.onlineStatus$.value;
  }

  /**
   * Observable de acciones pendientes
   */
  get pendingActionsObservable(): Observable<any[]> {
    return this.pendingActions$.asObservable();
  }

  /**
   * Almacenar datos en localStorage con timestamp
   */
  storeData(key: string, data: any): void {
    try {
      const storageData = {
        data,
        timestamp: Date.now(),
        version: '1.0'
      };
      localStorage.setItem(`offline_${key}`, JSON.stringify(storageData));
    } catch (error) {
      console.error('Error storing offline data:', error);
    }
  }

  /**
   * Recuperar datos del localStorage
   */
  getData(key: string, maxAge: number = 24 * 60 * 60 * 1000): any | null {
    try {
      const stored = localStorage.getItem(`offline_${key}`);
      if (!stored) return null;

      const storageData = JSON.parse(stored);
      const isExpired = Date.now() - storageData.timestamp > maxAge;
      
      if (isExpired) {
        localStorage.removeItem(`offline_${key}`);
        return null;
      }

      return storageData.data;
    } catch (error) {
      console.error('Error retrieving offline data:', error);
      return null;
    }
  }

  /**
   * Agregar una acción a la cola para sincronizar cuando vuelva la conexión
   */
  addPendingAction(action: {
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    url: string;
    data?: any;
    id: string;
    timestamp: number;
    description: string;
  }): void {
    const currentActions = this.pendingActions$.value;
    const newActions = [...currentActions, action];
    
    this.pendingActions$.next(newActions);
    this.savePendingActions(newActions);
  }

  /**
   * Remover una acción de la cola
   */
  removePendingAction(id: string): void {
    const currentActions = this.pendingActions$.value;
    const newActions = currentActions.filter(action => action.id !== id);
    
    this.pendingActions$.next(newActions);
    this.savePendingActions(newActions);
  }

  /**
   * Limpiar todas las acciones pendientes
   */
  clearPendingActions(): void {
    this.pendingActions$.next([]);
    this.savePendingActions([]);
  }

  /**
   * Procesar acciones pendientes cuando vuelve la conexión
   */
  private async processPendingActions(): Promise<void> {
    const actions = this.pendingActions$.value;
    
    if (actions.length === 0) return;

    console.log(`🔄 Procesando ${actions.length} acciones pendientes...`);
    
    // Ordenar acciones por timestamp para procesar en orden cronológico
    const sortedActions = [...actions].sort((a, b) => a.timestamp - b.timestamp);

    for (const action of sortedActions) {
      try {
        console.log(`📤 Enviando: ${action.description}`);
        
        // Enviar acción al servidor
        const result = await this.sendActionToServer(action);
        
        // Remover de la cola si fue exitoso
        this.removePendingAction(action.id);
        
        console.log(`✅ Sincronizado: ${action.description}`);
        
        // Pequeña pausa entre acciones para evitar sobrecargar el servidor
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Error sincronizando: ${action.description}`, error);
        
        // Marcar como fallida si es un error permanente
        if (this.isPermanentError(error)) {
          console.warn(`🚫 Eliminando acción con error permanente: ${action.description}`);
          this.removePendingAction(action.id);
        }
        // Si es error temporal, la acción permanece en la cola
      }
    }
    
    const remainingActions = this.pendingActions$.value.length;
    const processedCount = sortedActions.length - remainingActions;
    
    if (remainingActions === 0) {
      console.log('🎉 Todas las acciones se sincronizaron correctamente');
      if (processedCount > 0) {
        this.notificationService.showSyncComplete(processedCount);
      }
    } else {
      console.log(`⚠️ ${remainingActions} acciones pendientes quedan en la cola`);
      if (processedCount > 0) {
        this.notificationService.info(`${processedCount} operaciones sincronizadas. ${remainingActions} pendientes.`);
      }
    }
  }

  /**
   * Determinar si un error es permanente (no vale la pena reintentar)
   */
  private isPermanentError(error: any): boolean {
    if (error?.status) {
      // Errores 4xx generalmente son permanentes (datos inválidos, no autorizado, etc.)
      return error.status >= 400 && error.status < 500;
    }
    return false;
  }

  /**
   * Sincronización manual forzada
   */
  forceSynchronization(): Promise<void> {
    if (!this.isOnline) {
      return Promise.reject(new Error('No hay conexión disponible'));
    }
    
    return this.processPendingActions();
  }

  /**
   * Limpiar cola de sincronización manualmente (para debugging/emergencia)
   */
  clearSyncQueue(): void {
    console.warn('🧹 Limpiando cola de sincronización manualmente');
    this.clearPendingActions();
    this.notificationService.info('Cola de sincronización limpiada');
  }

  /**
   * Obtener información de debugging
   */
  getDebugInfo(): any {
    return {
      isOnline: this.isOnline,
      pendingActionsCount: this.pendingActions$.value.length,
      pendingActions: this.pendingActions$.value,
      cacheKeys: Object.keys(localStorage).filter(key => key.startsWith('offline_'))
    };
  }

  /**
   * Envío de acción al servidor usando HttpClient
   */
  private async sendActionToServer(action: any): Promise<any> {
    try {
      const { method, url, data } = action;
      console.log(`📤 Enviando ${method} a ${url}`, data ? data : '(sin datos)');
      
      let httpRequest: Observable<any>;
      
      switch (method) {
        case 'GET':
          httpRequest = this.http.get(url);
          break;
        case 'POST':
          httpRequest = this.http.post(url, data);
          break;
        case 'PUT':
          httpRequest = this.http.put(url, data);
          break;
        case 'PATCH':
          httpRequest = this.http.patch(url, data);
          break;
        case 'DELETE':
          httpRequest = this.http.delete(url);
          break;
        default:
          throw new Error(`Método HTTP no soportado: ${method}`);
      }
      
      // Convertir a promesa con timeout personalizado
      return await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Timeout: La petición tardó demasiado'));
        }, 30000); // 30 segundos timeout
        
        httpRequest.subscribe({
          next: (result) => {
            clearTimeout(timeout);
            console.log(`✅ Respuesta recibida para ${method} ${url}:`, result);
            resolve(result);
          },
          error: (error) => {
            clearTimeout(timeout);
            console.error(`❌ Error en ${method} ${url}:`, error);
            reject(error);
          }
        });
      });
      
    } catch (error) {
      console.error('Error enviando acción al servidor:', error);
      throw error;
    }
  }

  /**
   * Guardar acciones pendientes en localStorage
   */
  private savePendingActions(actions: any[]): void {
    try {
      localStorage.setItem('pending_actions', JSON.stringify(actions));
    } catch (error) {
      console.error('Error saving pending actions:', error);
    }
  }

  /**
   * Cargar acciones pendientes del localStorage
   */
  private loadPendingActions(): void {
    try {
      const stored = localStorage.getItem('pending_actions');
      if (stored) {
        const actions = JSON.parse(stored);
        this.pendingActions$.next(actions);
      }
    } catch (error) {
      console.error('Error loading pending actions:', error);
    }
  }

  /**
   * Realizar petición HTTP con estrategia cache-first
   */
  cacheFirstRequest<T>(
    cacheKey: string,
    httpRequest: Observable<T>,
    maxAge: number = 5 * 60 * 1000, // 5 minutos por defecto
    defaultData?: T
  ): Observable<T> {
    // Intentar servir desde cache primero
    const cachedData = this.getData(cacheKey, maxAge);
    
    if (cachedData && !this.isOnline) {
      // Si estamos offline y tenemos datos en cache, devolverlos
      return of(cachedData);
    }
    
    if (this.isOnline) {
      // Si estamos online, hacer la petición y cachear el resultado
      return httpRequest.pipe(
        map(data => {
          this.storeData(cacheKey, data);
          return data;
        }),
        catchError((error: HttpErrorResponse) => {
          // Si falla la petición y tenemos datos en cache, devolverlos
          if (cachedData) {
            console.warn('Petición falló, sirviendo desde cache:', error);
            return of(cachedData);
          }
          // Si no hay cache pero hay datos por defecto, usarlos
          if (defaultData) {
            console.warn('Petición falló, usando datos por defecto:', error);
            return of(defaultData);
          }
          // Si no hay cache ni datos por defecto, propagar el error
          return throwError(() => error);
        })
      );
    }
    
    // Si estamos offline y no hay cache
    if (cachedData) {
      return of(cachedData);
    }
    
    // Si no hay cache pero hay datos por defecto, usarlos
    if (defaultData) {
      console.warn('Sin conexión y sin cache, usando datos por defecto');
      return of(defaultData);
    }
    
    return throwError(() => new Error('Sin conexión y sin datos en cache'));
  }

  /**
   * Realizar petición HTTP que requiere conexión (CREATE, UPDATE, DELETE)
   */
  onlineOnlyRequest<T>(
    method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    url: string,
    data?: any,
    description: string = 'Operación pendiente'
  ): Observable<T> {
    if (this.isOnline) {
      // Si estamos online, realizar la petición directamente
      return this.makeHttpRequest<T>(method, url, data);
    } else {
      // Si estamos offline, agregar a la cola de acciones pendientes
      const actionId = this.generateActionId();
      this.addPendingAction({
        id: actionId,
        method,
        url,
        data,
        timestamp: Date.now(),
        description
      });
      
      // Devolver un observable que simula éxito para UX
      return of({
        id: actionId,
        ...data,
        _offline: true,
        _pending: true
      } as T);
    }
  }

  /**
   * Realizar petición HTTP
   */
  private makeHttpRequest<T>(method: string, url: string, data?: any): Observable<T> {
    switch (method) {
      case 'GET':
        return this.http.get<T>(url);
      case 'POST':
        return this.http.post<T>(url, data);
      case 'PUT':
        return this.http.put<T>(url, data);
      case 'PATCH':
        return this.http.patch<T>(url, data);
      case 'DELETE':
        return this.http.delete<T>(url);
      default:
        return throwError(() => new Error(`Método HTTP no soportado: ${method}`));
    }
  }

  /**
   * Generar ID único para acciones
   */
  private generateActionId(): string {
    return `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Limpiar datos expirados del cache
   */
  cleanExpiredData(): void {
    const keys = Object.keys(localStorage);
    const offlineKeys = keys.filter(key => key.startsWith('offline_'));
    
    offlineKeys.forEach(key => {
      try {
        const stored = localStorage.getItem(key);
        if (stored) {
          const storageData = JSON.parse(stored);
          const isExpired = Date.now() - storageData.timestamp > 24 * 60 * 60 * 1000; // 24 horas
          
          if (isExpired) {
            localStorage.removeItem(key);
          }
        }
      } catch (error) {
        // Si hay error parseando, mejor eliminar la clave corrupta
        localStorage.removeItem(key);
      }
    });
  }
}