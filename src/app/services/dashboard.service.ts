import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { OfflineService } from './offline.service';
import { environment } from '../../environments/environment';
import { 
  DashboardEstadisticas, 
  MovimientoReciente, 
  ProductoStockBajo, 
  DashboardGraficos, 
  InventarioResumen 
} from '../interfaces/dashboard.interface';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly baseUrl = `${environment.apiUrl}/dashboard`;

  constructor(
    private http: HttpClient,
    private offlineService: OfflineService
  ) {}

  getEstadisticas(): Observable<DashboardEstadisticas> {
    const cacheKey = 'dashboard_estadisticas';
    const httpRequest = this.http.get<DashboardEstadisticas>(`${this.baseUrl}/estadisticas`);
    return this.offlineService.cacheFirstRequest(cacheKey, httpRequest, 5 * 60 * 1000);
  }

  getMovimientosRecientes(limit: number = 10): Observable<MovimientoReciente[]> {
    const params = new HttpParams().set('limit', limit.toString());
    const cacheKey = `dashboard_movimientos_recientes_${limit}`;
    const httpRequest = this.http.get<MovimientoReciente[]>(`${this.baseUrl}/movimientos-recientes`, { params });
    return this.offlineService.cacheFirstRequest(cacheKey, httpRequest, 2 * 60 * 1000);
  }

  getProductosStockBajo(limite: number = 5): Observable<ProductoStockBajo[]> {
    const params = new HttpParams().set('limite', limite.toString());
    const cacheKey = `dashboard_productos_stock_bajo_${limite}`;
    const httpRequest = this.http.get<ProductoStockBajo[]>(`${this.baseUrl}/productos-stock-bajo`, { params });
    return this.offlineService.cacheFirstRequest(cacheKey, httpRequest, 10 * 60 * 1000);
  }

  getGraficos(): Observable<DashboardGraficos> {
    const cacheKey = 'dashboard_graficos';
    const httpRequest = this.http.get<DashboardGraficos>(`${this.baseUrl}/graficos`);
    return this.offlineService.cacheFirstRequest(cacheKey, httpRequest, 5 * 60 * 1000);
  }

  getInventarioResumen(): Observable<InventarioResumen[]> {
    const cacheKey = 'dashboard_inventario_resumen';
    const httpRequest = this.http.get<InventarioResumen[]>(`${this.baseUrl}/inventario-resumen`);
    return this.offlineService.cacheFirstRequest(cacheKey, httpRequest, 10 * 60 * 1000);
  }
}