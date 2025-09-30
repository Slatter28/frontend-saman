import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface NotificationMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationSubject = new Subject<NotificationMessage>();
  public notifications$ = this.notificationSubject.asObservable();

  private generateId(): string {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  success(message: string, duration: number = 5000): void {
    this.show({
      id: this.generateId(),
      type: 'success',
      message,
      duration,
      timestamp: Date.now()
    });
  }

  error(message: string, duration: number = 8000): void {
    this.show({
      id: this.generateId(),
      type: 'error',
      message,
      duration,
      timestamp: Date.now()
    });
  }

  warning(message: string, duration: number = 6000): void {
    this.show({
      id: this.generateId(),
      type: 'warning',
      message,
      duration,
      timestamp: Date.now()
    });
  }

  info(message: string, duration: number = 5000): void {
    this.show({
      id: this.generateId(),
      type: 'info',
      message,
      duration,
      timestamp: Date.now()
    });
  }

  private show(notification: NotificationMessage): void {
    this.notificationSubject.next(notification);
  }

  // Métodos específicos para offline
  showOfflineWarning(): void {
    this.warning('Sin conexión a internet. Los cambios se guardarán localmente y se sincronizarán cuando vuelva la conexión.', 10000);
  }

  showOnlineSuccess(): void {
    this.success('Conexión restablecida. Sincronizando datos...', 3000);
  }

  showSyncComplete(syncCount: number): void {
    this.success(`Sincronización completada. ${syncCount} operaciones procesadas.`, 4000);
  }

  showSyncError(errorCount: number): void {
    this.error(`Error en sincronización. ${errorCount} operaciones fallaron.`, 6000);
  }
}