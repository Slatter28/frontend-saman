import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// PrimeNG Components
import { Card } from 'primeng/card';
import { Button } from 'primeng/button';
import { Tag } from 'primeng/tag';
import { Badge } from 'primeng/badge';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ProgressSpinner } from 'primeng/progressspinner';
import { Tooltip } from 'primeng/tooltip';
import { ChartModule } from 'primeng/chart';

// Services and Interfaces
import { DashboardService } from '../../services/dashboard.service';
import { 
  DashboardEstadisticas, 
  MovimientoReciente, 
  ProductoStockBajo, 
  DashboardGraficos, 
  InventarioResumen 
} from '../../interfaces/dashboard.interface';

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    Card,
    Button,
    Tag,
    Badge,
    ToastModule,
    ProgressSpinner,
    Tooltip,
    ChartModule
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  providers: [MessageService]
})
export class Dashboard implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Data
  estadisticas: DashboardEstadisticas | null = null;
  movimientosRecientes: MovimientoReciente[] = [];
  productosStockBajo: ProductoStockBajo[] = [];
  graficos: DashboardGraficos | null = null;
  inventarioResumen: InventarioResumen[] = [];

  // Loading states
  initialLoading = true;
  loading = false;
  loadingMovimientos = false;
  loadingStock = false;
  loadingInventario = false;
  loadingGraficos = false;

  // Chart data
  movimientosPorDiaChart: any = {};
  entradasVsSalidasChart: any = {};
  topProductosChart: any = {};
  movimientosPorBodegaChart: any = {};
  chartOptions: any = {};

  constructor(
    private dashboardService: DashboardService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {
    this.initializeChartOptions();
  }

  ngOnInit(): void {
    this.loadDashboardData();
    // Escuchar cambios de tema
    this.observeThemeChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDashboardData(): void {
    this.initialLoading = true;
    
    // Cargar todas las secciones en paralelo
    this.loadEstadisticas();
    this.loadMovimientosRecientes();
    this.loadProductosStockBajo();
    this.loadInventarioResumen();
    this.loadGraficos();
  }

  refreshDashboard(): void {
    this.loading = true;
    this.loadDashboardData();
    
    setTimeout(() => {
      this.loading = false;
      this.showSuccess('Dashboard actualizado correctamente');
    }, 1000);
  }

  private loadEstadisticas(): void {
    this.dashboardService.getEstadisticas()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.estadisticas = data;
          this.checkInitialLoadingComplete();
        },
        error: (error) => {
          this.showError('Error al cargar estadísticas', error);
          this.checkInitialLoadingComplete();
        }
      });
  }

  private loadMovimientosRecientes(): void {
    this.loadingMovimientos = true;
    this.dashboardService.getMovimientosRecientes(10)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.movimientosRecientes = data;
          this.loadingMovimientos = false;
          this.checkInitialLoadingComplete();
        },
        error: (error) => {
          this.loadingMovimientos = false;
          this.showError('Error al cargar movimientos recientes', error);
          this.checkInitialLoadingComplete();
        }
      });
  }

  private loadProductosStockBajo(): void {
    this.loadingStock = true;
    this.dashboardService.getProductosStockBajo(10)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.productosStockBajo = data;
          this.loadingStock = false;
          this.checkInitialLoadingComplete();
        },
        error: (error) => {
          this.loadingStock = false;
          this.showError('Error al cargar productos con stock bajo', error);
          this.checkInitialLoadingComplete();
        }
      });
  }

  private loadInventarioResumen(): void {
    this.loadingInventario = true;
    this.dashboardService.getInventarioResumen()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.inventarioResumen = data;
          this.loadingInventario = false;
          this.checkInitialLoadingComplete();
        },
        error: (error) => {
          this.loadingInventario = false;
          this.showError('Error al cargar resumen de inventario', error);
          this.checkInitialLoadingComplete();
        }
      });
  }

  private loadGraficos(): void {
    this.loadingGraficos = true;
    this.dashboardService.getGraficos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.graficos = data;
          this.processChartsData();
          this.loadingGraficos = false;
          this.checkInitialLoadingComplete();
        },
        error: (error) => {
          this.loadingGraficos = false;
          this.showError('Error al cargar gráficos', error);
          this.checkInitialLoadingComplete();
        }
      });
  }

  private checkInitialLoadingComplete(): void {
    // Verificar si todas las cargas principales han terminado
    if (this.estadisticas !== null && 
        !this.loadingMovimientos && 
        !this.loadingStock && 
        !this.loadingInventario &&
        !this.loadingGraficos) {
      this.initialLoading = false;
      this.cdr.detectChanges();
    }
  }

  // Utility Methods
  private showSuccess(message: string): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Éxito',
      detail: message,
      life: 3000
    });
  }

  private showError(summary: string, error?: any): void {
    let detail = 'Ha ocurrido un error inesperado';
    
    if (error?.error?.message) {
      detail = error.error.message;
    } else if (typeof error === 'string') {
      detail = error;
    }

    this.messageService.add({
      severity: 'error',
      summary,
      detail,
      life: 5000
    });
  }

  private showInfo(message: string): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Información',
      detail: message,
      life: 3000
    });
  }

  // Calculated Methods
  getTotalStock(): number {
    return this.inventarioResumen.reduce((sum, bodega) => sum + bodega.stock_total, 0);
  }

  // Chart Processing Methods
  private processChartsData(): void {
    if (!this.graficos) return;

    this.processMovimientosPorDiaChart();
    this.processEntradasVsSalidasChart();
    this.processTopProductosChart();
    this.processMovimientosPorBodegaChart();
  }

  private processMovimientosPorDiaChart(): void {
    if (!this.graficos?.movimientosPorDia) return;

    const isDarkMode = document.body.classList.contains('my-app-dark');
    const primaryColor = isDarkMode ? '#60a5fa' : '#3b82f6';
    const primaryColorAlpha = isDarkMode ? 'rgba(96, 165, 250, 0.1)' : 'rgba(59, 130, 246, 0.1)';

    const labels = this.graficos.movimientosPorDia.map(item => 
      new Date(item.fecha).toLocaleDateString('es-CO', { month: 'short', day: '2-digit' })
    );
    const data = this.graficos.movimientosPorDia.map(item => item.cantidad);

    this.movimientosPorDiaChart = {
      labels: labels,
      datasets: [{
        label: 'Movimientos por Día',
        data: data,
        borderColor: primaryColor,
        backgroundColor: primaryColorAlpha,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: primaryColor,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2
      }]
    };
  }

  private processEntradasVsSalidasChart(): void {
    if (!this.graficos?.entradasVsSalidas) return;

    const isDarkMode = document.body.classList.contains('my-app-dark');
    
    const greenColor = isDarkMode ? 'rgba(52, 211, 153, 0.8)' : 'rgba(34, 197, 94, 0.8)';
    const redColor = isDarkMode ? 'rgba(248, 113, 113, 0.8)' : 'rgba(239, 68, 68, 0.8)';
    const greenBorder = isDarkMode ? 'rgb(52, 211, 153)' : 'rgb(34, 197, 94)';
    const redBorder = isDarkMode ? 'rgb(248, 113, 113)' : 'rgb(239, 68, 68)';

    const entradas = this.graficos.entradasVsSalidas
      .filter(item => item.tipo === 'entrada')
      .reduce((sum, item) => sum + item.cantidad, 0);
    
    const salidas = this.graficos.entradasVsSalidas
      .filter(item => item.tipo === 'salida')
      .reduce((sum, item) => sum + item.cantidad, 0);

    this.entradasVsSalidasChart = {
      labels: ['Entradas', 'Salidas'],
      datasets: [{
        data: [entradas, salidas],
        backgroundColor: [greenColor, redColor],
        borderColor: [greenBorder, redBorder],
        borderWidth: 2,
        hoverBackgroundColor: [
          isDarkMode ? 'rgba(52, 211, 153, 0.9)' : 'rgba(34, 197, 94, 0.9)',
          isDarkMode ? 'rgba(248, 113, 113, 0.9)' : 'rgba(239, 68, 68, 0.9)'
        ]
      }]
    };
  }

  private processTopProductosChart(): void {
    if (!this.graficos?.topProductosMasMovidos) return;

    const isDarkMode = document.body.classList.contains('my-app-dark');

    const colors = isDarkMode ? [
      'rgba(96, 165, 250, 0.8)',    // blue
      'rgba(52, 211, 153, 0.8)',    // green  
      'rgba(251, 191, 36, 0.8)',    // yellow
      'rgba(167, 139, 250, 0.8)',   // purple
      'rgba(244, 114, 182, 0.8)'    // pink
    ] : [
      'rgba(59, 130, 246, 0.8)',
      'rgba(16, 185, 129, 0.8)',
      'rgba(245, 158, 11, 0.8)',
      'rgba(139, 92, 246, 0.8)',
      'rgba(236, 72, 153, 0.8)'
    ];

    const borderColors = isDarkMode ? [
      'rgb(96, 165, 250)',
      'rgb(52, 211, 153)', 
      'rgb(251, 191, 36)',
      'rgb(167, 139, 250)',
      'rgb(244, 114, 182)'
    ] : [
      'rgb(59, 130, 246)',
      'rgb(16, 185, 129)',
      'rgb(245, 158, 11)',
      'rgb(139, 92, 246)',
      'rgb(236, 72, 153)'
    ];

    const labels = this.graficos.topProductosMasMovidos.map(item => 
      item.descripcion.length > 20 ? item.descripcion.substring(0, 20) + '...' : item.descripcion
    );
    const data = this.graficos.topProductosMasMovidos.map(item => item.cantidad_total);

    this.topProductosChart = {
      labels: labels,
      datasets: [{
        label: 'Cantidad Total',
        data: data,
        backgroundColor: colors,
        borderColor: borderColors,
        borderWidth: 2
      }]
    };
  }

  private processMovimientosPorBodegaChart(): void {
    if (!this.graficos?.movimientosPorBodega) return;

    const isDarkMode = document.body.classList.contains('my-app-dark');
    
    const greenColor = isDarkMode ? 'rgba(52, 211, 153, 0.8)' : 'rgba(34, 197, 94, 0.8)';
    const redColor = isDarkMode ? 'rgba(248, 113, 113, 0.8)' : 'rgba(239, 68, 68, 0.8)';
    const greenBorder = isDarkMode ? 'rgb(52, 211, 153)' : 'rgb(34, 197, 94)';
    const redBorder = isDarkMode ? 'rgb(248, 113, 113)' : 'rgb(239, 68, 68)';

    const labels = this.graficos.movimientosPorBodega.map(item => item.nombre);
    const entradas = this.graficos.movimientosPorBodega.map(item => item.entradas);
    const salidas = this.graficos.movimientosPorBodega.map(item => item.salidas);

    this.movimientosPorBodegaChart = {
      labels: labels,
      datasets: [
        {
          label: 'Entradas',
          data: entradas,
          backgroundColor: greenColor,
          borderColor: greenBorder,
          borderWidth: 1
        },
        {
          label: 'Salidas',
          data: salidas,
          backgroundColor: redColor,
          borderColor: redBorder,
          borderWidth: 1
        }
      ]
    };
  }

  private initializeChartOptions(): void {
    // Detectar si estamos en modo dark
    const isDarkMode = document.body.classList.contains('my-app-dark');
    
    const textColor = isDarkMode ? '#e4e7eb' : '#374151';
    const secondaryTextColor = isDarkMode ? '#9ca3af' : '#6b7280';
    const gridColor = isDarkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(209, 213, 219, 0.3)';
    const borderColor = isDarkMode ? 'rgba(75, 85, 99, 0.5)' : 'rgba(209, 213, 219, 0.5)';
    const tooltipBg = isDarkMode ? 'rgba(17, 24, 39, 0.95)' : 'rgba(255, 255, 255, 0.95)';

    this.chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 20,
            color: textColor,
            font: {
              family: 'Inter, sans-serif',
              size: 12
            }
          }
        },
        tooltip: {
          backgroundColor: tooltipBg,
          titleColor: textColor,
          bodyColor: textColor,
          borderColor: borderColor,
          borderWidth: 1,
          cornerRadius: 8,
          titleFont: {
            family: 'Inter, sans-serif',
            size: 13,
            weight: '600'
          },
          bodyFont: {
            family: 'Inter, sans-serif',
            size: 12
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: secondaryTextColor,
            font: {
              family: 'Inter, sans-serif',
              size: 11
            }
          },
          grid: {
            color: gridColor,
            borderColor: borderColor
          }
        },
        y: {
          ticks: {
            color: secondaryTextColor,
            font: {
              family: 'Inter, sans-serif',
              size: 11
            }
          },
          grid: {
            color: gridColor,
            borderColor: borderColor
          }
        }
      }
    };
  }

  private observeThemeChanges(): void {
    // Observar cambios en la clase del body para detectar cambios de tema
    const observer = new MutationObserver(() => {
      this.initializeChartOptions();
      this.processChartsData(); // Recargar charts con nuevos colores
      this.cdr.detectChanges();
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
    });

    // Cleanup cuando se destruya el componente
    this.destroy$.subscribe(() => {
      observer.disconnect();
    });
  }

  // Formatters
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  formatTime(dateString: string): string {
    return new Date(dateString).toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}