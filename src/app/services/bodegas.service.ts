import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { OfflineService } from './offline.service';
import { environment } from '../../environments/environment';
import { 
  Bodega, 
  BodegaCreate, 
  BodegaUpdate, 
  BodegasResponse, 
  BodegaInventario,
  BodegaFilters 
} from '../interfaces/bodega.interface';

@Injectable({
  providedIn: 'root'
})
export class BodegasService {
  private readonly baseUrl = `${environment.apiUrl}/bodegas`;

  constructor(
    private http: HttpClient,
    private offlineService: OfflineService
  ) {}

  /**
   * Obtiene la lista de bodegas con paginación y filtros
   */
  getBodegas(filters: BodegaFilters = {}): Observable<BodegasResponse> {
    let params = new HttpParams();
    
    if (filters.page) {
      params = params.set('page', filters.page.toString());
    }
    if (filters.limit) {
      params = params.set('limit', filters.limit.toString());
    }
    if (filters.nombre) {
      params = params.set('nombre', filters.nombre);
    }
    if (filters.ubicacion) {
      params = params.set('ubicacion', filters.ubicacion);
    }

    const cacheKey = `bodegas_${JSON.stringify(filters)}`;
    const httpRequest = this.http.get<BodegasResponse>(this.baseUrl, { params });
    return this.offlineService.cacheFirstRequest(cacheKey, httpRequest, 5 * 60 * 1000);
  }

  /**
   * Obtiene el detalle de una bodega específica
   */
  getBodegaById(id: number): Observable<Bodega> {
    const cacheKey = `bodega_${id}`;
    const httpRequest = this.http.get<Bodega>(`${this.baseUrl}/${id}`);
    return this.offlineService.cacheFirstRequest(cacheKey, httpRequest, 10 * 60 * 1000);
  }

  /**
   * Obtiene el inventario de una bodega específica
   */
  getBodegaInventario(id: number): Observable<BodegaInventario> {
    const cacheKey = `bodega_inventario_${id}`;
    const httpRequest = this.http.get<BodegaInventario>(`${this.baseUrl}/${id}/inventario`);
    return this.offlineService.cacheFirstRequest(cacheKey, httpRequest, 2 * 60 * 1000);
  }

  /**
   * Crea una nueva bodega
   */
  createBodega(bodega: BodegaCreate): Observable<Bodega> {
    return this.offlineService.onlineOnlyRequest<Bodega>(
      'POST',
      this.baseUrl,
      bodega,
      `Crear bodega: ${bodega.nombre}`
    );
  }

  /**
   * Actualiza una bodega existente
   */
  updateBodega(id: number, bodega: BodegaUpdate): Observable<Bodega> {
    return this.offlineService.onlineOnlyRequest<Bodega>(
      'PATCH',
      `${this.baseUrl}/${id}`,
      bodega,
      `Actualizar bodega ID: ${id}`
    );
  }

  /**
   * Elimina una bodega (solo admin)
   */
  deleteBodega(id: number): Observable<void> {
    return this.offlineService.onlineOnlyRequest<void>(
      'DELETE',
      `${this.baseUrl}/${id}`,
      undefined,
      `Eliminar bodega ID: ${id}`
    );
  }
}