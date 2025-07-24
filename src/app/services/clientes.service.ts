import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  Cliente, 
  ClienteDetalle, 
  CreateClienteDto, 
  UpdateClienteDto, 
  ClientesResponse, 
  ClienteFilters,
  ClienteMovimientosResponse,
  ClienteStats,
  TipoCliente
} from '../interfaces/cliente.interface';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ClientesService {
  private readonly apiUrl = `${environment.apiUrl}/clientes`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene la lista de clientes con filtros y paginación
   */
  getClientes(filters: ClienteFilters = {}): Observable<ClientesResponse> {
    let params = new HttpParams();
    
    if (filters.page) {
      params = params.set('page', filters.page.toString());
    }
    if (filters.limit) {
      params = params.set('limit', filters.limit.toString());
    }
    if (filters.nombre?.trim()) {
      params = params.set('nombre', filters.nombre.trim());
    }
    if (filters.email?.trim()) {
      params = params.set('email', filters.email.trim());
    }
    if (filters.tipo) {
      params = params.set('tipo', filters.tipo);
    }

    return this.http.get<ClientesResponse>(this.apiUrl, { params });
  }

  /**
   * Obtiene el detalle de un cliente específico
   */
  getCliente(id: number): Observable<ClienteDetalle> {
    return this.http.get<ClienteDetalle>(`${this.apiUrl}/${id}`);
  }

  /**
   * Obtiene los movimientos de un cliente específico
   */
  getClienteMovimientos(id: number): Observable<ClienteMovimientosResponse> {
    return this.http.get<ClienteMovimientosResponse>(`${this.apiUrl}/${id}/movimientos`);
  }

  /**
   * Crea un nuevo cliente
   */
  createCliente(cliente: CreateClienteDto): Observable<Cliente> {
    return this.http.post<Cliente>(this.apiUrl, cliente);
  }

  /**
   * Actualiza un cliente existente
   */
  updateCliente(id: number, cliente: Partial<CreateClienteDto>): Observable<Cliente> {
    return this.http.patch<Cliente>(`${this.apiUrl}/${id}`, cliente);
  }

  /**
   * Elimina un cliente
   */
  deleteCliente(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Obtiene estadísticas básicas de clientes
   */
  getClienteStats(): Observable<ClienteStats> {
    // Este endpoint podría no existir, así que simulamos las estadísticas
    // basándonos en la lista completa de clientes
    return new Observable(observer => {
      this.getClientes({ limit: 1000 }).subscribe({
        next: (response) => {
          const stats: ClienteStats = {
            total: response.meta.total,
            totalClientes: response.data.filter(c => c.tipo === 'cliente').length,
            totalProveedores: response.data.filter(c => c.tipo === 'proveedor').length,
            totalAmbos: response.data.filter(c => c.tipo === 'ambos').length
          };
          observer.next(stats);
          observer.complete();
        },
        error: (error) => observer.error(error)
      });
    });
  }

  /**
   * Valida si un email ya existe (para validaciones)
   */
  validateEmailUnique(email: string, excludeId?: number): Observable<boolean> {
    let params = new HttpParams().set('email', email);
    if (excludeId) {
      params = params.set('exclude', excludeId.toString());
    }
    
    // Usamos la búsqueda por email para validar unicidad
    return new Observable(observer => {
      this.getClientes({ email, limit: 1 }).subscribe({
        next: (response) => {
          const isUnique = excludeId 
            ? response.data.length === 0 || (response.data.length === 1 && response.data[0].id === excludeId)
            : response.data.length === 0;
          observer.next(isUnique);
          observer.complete();
        },
        error: (error) => {
          observer.error(error);
        }
      });
    });
  }

  /**
   * Busca clientes por nombre (para autocompletado)
   */
  searchClientesByName(query: string, limit: number = 10): Observable<Cliente[]> {
    return new Observable(observer => {
      this.getClientes({ nombre: query, limit }).subscribe({
        next: (response) => {
          observer.next(response.data);
          observer.complete();
        },
        error: (error) => observer.error(error)
      });
    });
  }

  /**
   * Obtiene opciones para el dropdown de tipos
   */
  getTipoOptions(): Array<{label: string, value: TipoCliente}> {
    return [
      { label: 'Cliente', value: 'cliente' },
      { label: 'Proveedor', value: 'proveedor' },
      { label: 'Cliente y Proveedor', value: 'ambos' }
    ];
  }
}