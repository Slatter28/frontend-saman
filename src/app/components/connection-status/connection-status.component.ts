import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';

// PrimeNG Components
import { Card } from 'primeng/card';
import { Button } from 'primeng/button';
import { Badge } from 'primeng/badge';
import { Tooltip } from 'primeng/tooltip';
import { ProgressSpinner } from 'primeng/progressspinner';

import { OfflineService } from '../../services/offline.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-connection-status',
  standalone: true,
  imports: [
    CommonModule,
    Card,
    Button,
    Badge,
    Tooltip,
    ProgressSpinner
  ],
  template: `
    <div class="connection-status" 
         [class.online]="isOnline" 
         [class.offline]="!isOnline"
         [class.has-pending]="pendingActionsCount > 0">
      
      <!-- Indicador de conexión -->
      <div class="status-indicator">
        <i [class]="getStatusIcon()"></i>
        <span class="status-text">{{ getStatusText() }}</span>
        
        <!-- Badge de acciones pendientes -->
        <p-badge 
          *ngIf="pendingActionsCount > 0"
          [value]="pendingActionsCount.toString()"
          severity="warn"
          pTooltip="Operaciones pendientes de sincronización">
        </p-badge>
      </div>

      <!-- Botón de sincronización manual -->
      <p-button
        *ngIf="!isOnline && pendingActionsCount > 0"
        icon="pi pi-refresh"
        label="Reintentar"
        size="small"
        severity="secondary"
        [outlined]="true"
        (click)="retrySynchronization()"
        pTooltip="Reintentar sincronización cuando vuelva la conexión">
      </p-button>

      <!-- Spinner cuando está sincronizando -->
      <p-progressSpinner
        *ngIf="isOnline && pendingActionsCount > 0"
        [style]="{ width: '20px', height: '20px' }"
        strokeWidth="4">
      </p-progressSpinner>
    </div>
  `,
  styleUrls: ['./connection-status.component.scss']
})
export class ConnectionStatusComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  isOnline = true;
  pendingActionsCount = 0;

  constructor(
    private offlineService: OfflineService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Suscribirse al estado de conexión
    this.offlineService.isOnline$
      .pipe(takeUntil(this.destroy$))
      .subscribe(status => {
        this.isOnline = status;
      });

    // Suscribirse a las acciones pendientes
    this.offlineService.pendingActionsObservable
      .pipe(takeUntil(this.destroy$))
      .subscribe(actions => {
        this.pendingActionsCount = actions.length;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getStatusIcon(): string {
    if (!this.isOnline) {
      return 'pi pi-wifi text-red-500';
    }
    
    if (this.pendingActionsCount > 0) {
      return 'pi pi-sync text-orange-500';
    }
    
    return 'pi pi-check-circle text-green-500';
  }

  getStatusText(): string {
    if (!this.isOnline) {
      return 'Sin conexión';
    }
    
    if (this.pendingActionsCount > 0) {
      return 'Sincronizando...';
    }
    
    return 'Conectado';
  }

  retrySynchronization(): void {
    if (this.offlineService.isOnline && this.pendingActionsCount > 0) {
      // Si hay conexión, forzar sincronización
      console.log('🔄 Iniciando sincronización manual...');
      this.offlineService.forceSynchronization()
        .then(() => {
          console.log('✅ Sincronización manual completada');
        })
        .catch(error => {
          console.error('❌ Error en sincronización manual:', error);
          // Si hay error persistente, mostrar info de debug
          console.log('🔍 Debug info:', this.offlineService.getDebugInfo());
        });
    } else {
      // Si no hay conexión, intentar forzar verificación
      if ('navigator' in window && 'onLine' in navigator) {
        window.dispatchEvent(new Event('online'));
      }
    }
  }

  // Método para debugging (puedes llamarlo desde la consola del navegador)
  clearSyncQueue(): void {
    this.offlineService.clearSyncQueue();
  }

  // Método para debugging (puedes llamarlo desde la consola del navegador)
  getDebugInfo(): any {
    return {
      offline: this.offlineService.getDebugInfo(),
      session: this.authService.getPWASessionInfo()
    };
  }

  // Método para debugging - información de sesión PWA
  getPWASessionInfo(): any {
    return this.authService.getPWASessionInfo();
  }
}