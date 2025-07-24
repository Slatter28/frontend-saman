import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
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
  private readonly baseUrl = 'http://localhost:3000/api/dashboard';

  constructor(private http: HttpClient) {}

  getEstadisticas(): Observable<DashboardEstadisticas> {
    return this.http.get<DashboardEstadisticas>(`${this.baseUrl}/estadisticas`);
  }

  getMovimientosRecientes(limit: number = 10): Observable<MovimientoReciente[]> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<MovimientoReciente[]>(`${this.baseUrl}/movimientos-recientes`, { params });
  }

  getProductosStockBajo(limite: number = 5): Observable<ProductoStockBajo[]> {
    const params = new HttpParams().set('limite', limite.toString());
    return this.http.get<ProductoStockBajo[]>(`${this.baseUrl}/productos-stock-bajo`, { params });
  }

  getGraficos(): Observable<DashboardGraficos> {
    return this.http.get<DashboardGraficos>(`${this.baseUrl}/graficos`);
  }

  getInventarioResumen(): Observable<InventarioResumen[]> {
    return this.http.get<InventarioResumen[]>(`${this.baseUrl}/inventario-resumen`);
  }
}