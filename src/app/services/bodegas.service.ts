import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
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
  private readonly baseUrl = 'http://localhost:3000/api/bodegas';

  constructor(private http: HttpClient) {}

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

    return this.http.get<BodegasResponse>(this.baseUrl, { params });
  }

  /**
   * Obtiene el detalle de una bodega específica
   */
  getBodegaById(id: number): Observable<Bodega> {
    return this.http.get<Bodega>(`${this.baseUrl}/${id}`);
  }

  /**
   * Obtiene el inventario de una bodega específica
   */
  getBodegaInventario(id: number): Observable<BodegaInventario> {
    return this.http.get<BodegaInventario>(`${this.baseUrl}/${id}/inventario`);
  }

  /**
   * Crea una nueva bodega
   */
  createBodega(bodega: BodegaCreate): Observable<Bodega> {
    return this.http.post<Bodega>(this.baseUrl, bodega);
  }

  /**
   * Actualiza una bodega existente
   */
  updateBodega(id: number, bodega: BodegaUpdate): Observable<Bodega> {
    return this.http.patch<Bodega>(`${this.baseUrl}/${id}`, bodega);
  }

  /**
   * Elimina una bodega (solo admin)
   */
  deleteBodega(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}