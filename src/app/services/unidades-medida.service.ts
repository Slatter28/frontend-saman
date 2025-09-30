import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { OfflineService } from './offline.service';
import { 
  UnidadMedida, 
  UnidadMedidaDetalle,
  CreateUnidadMedidaDto, 
  UpdateUnidadMedidaDto, 
  UnidadesMedidaResponse, 
  UnidadMedidaFilters,
  UnidadesMedidaStats,
  UnidadPredefinida
} from '../interfaces/unidad-medida.interface';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UnidadesMedidaService {
  private readonly apiUrl = `${environment.apiUrl}/unidades-medida`;

  constructor(
    private http: HttpClient,
    private offlineService: OfflineService
  ) {}

  /**
   * Obtiene la lista de unidades de medida con filtros y paginación
   */
  getUnidadesMedida(filters: UnidadMedidaFilters = {}): Observable<UnidadesMedidaResponse> {
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

    const cacheKey = `unidades_medida_${JSON.stringify(filters)}`;
    const httpRequest = this.http.get<UnidadesMedidaResponse>(this.apiUrl, { params });
    return this.offlineService.cacheFirstRequest(cacheKey, httpRequest, 10 * 60 * 1000);
  }

  /**
   * Obtiene todas las unidades de medida sin paginación (para selects/dropdowns)
   */
  getAllUnidadesMedida(): Observable<UnidadMedida[]> {
    const cacheKey = 'unidades_medida_all';
    const httpRequest = this.http.get<UnidadMedida[]>(`${this.apiUrl}/all`);
    return this.offlineService.cacheFirstRequest(cacheKey, httpRequest, 15 * 60 * 1000);
  }

  /**
   * Obtiene una unidad de medida por ID con productos asociados
   */
  getUnidadMedidaById(id: number): Observable<UnidadMedidaDetalle> {
    const cacheKey = `unidad_medida_${id}`;
    const httpRequest = this.http.get<UnidadMedidaDetalle>(`${this.apiUrl}/${id}`);
    return this.offlineService.cacheFirstRequest(cacheKey, httpRequest, 10 * 60 * 1000);
  }

  /**
   * Crea una nueva unidad de medida
   */
  createUnidadMedida(unidad: CreateUnidadMedidaDto): Observable<UnidadMedida> {
    return this.offlineService.onlineOnlyRequest<UnidadMedida>(
      'POST',
      this.apiUrl,
      unidad,
      `Crear unidad de medida: ${unidad.nombre}`
    );
  }

  /**
   * Actualiza una unidad de medida existente
   */
  updateUnidadMedida(id: number, unidad: UpdateUnidadMedidaDto): Observable<UnidadMedida> {
    return this.offlineService.onlineOnlyRequest<UnidadMedida>(
      'PATCH',
      `${this.apiUrl}/${id}`,
      unidad,
      `Actualizar unidad de medida ID: ${id}`
    );
  }

  /**
   * Elimina una unidad de medida
   */
  deleteUnidadMedida(id: number): Observable<void> {
    return this.offlineService.onlineOnlyRequest<void>(
      'DELETE',
      `${this.apiUrl}/${id}`,
      undefined,
      `Eliminar unidad de medida ID: ${id}`
    );
  }

  /**
   * Verifica si una unidad de medida puede ser eliminada (no tiene productos asociados)
   */
  canDeleteUnidadMedida(id: number): Observable<{ canDelete: boolean; productoCount: number }> {
    return this.http.get<{ canDelete: boolean; productoCount: number }>(`${this.apiUrl}/${id}/can-delete`);
  }

  /**
   * Obtiene estadísticas de las unidades de medida
   */
  getUnidadesMedidaStats(): Observable<UnidadesMedidaStats> {
    const cacheKey = 'unidades_medida_stats';
    const httpRequest = this.http.get<UnidadesMedidaStats>(`${this.apiUrl}/stats`);
    return this.offlineService.cacheFirstRequest(cacheKey, httpRequest, 5 * 60 * 1000);
  }

  /**
   * Verifica si existe una unidad con el nombre dado
   */
  checkNombreExists(nombre: string, excludeId?: number): Observable<{ exists: boolean }> {
    let params = new HttpParams().set('nombre', nombre);
    if (excludeId) {
      params = params.set('excludeId', excludeId.toString());
    }
    return this.http.get<{ exists: boolean }>(`${this.apiUrl}/check-nombre`, { params });
  }

  /**
   * Crea múltiples unidades predefinidas
   */
  createUnidadesPredefinidas(unidades: CreateUnidadMedidaDto[]): Observable<UnidadMedida[]> {
    return this.http.post<UnidadMedida[]>(`${this.apiUrl}/bulk-create`, { unidades });
  }

  /**
   * Obtiene las unidades predefinidas disponibles
   */
  getUnidadesPredefinidas(): UnidadPredefinida[] {
    return [
      { nombre: 'und', descripcion: 'Unidad', categoria: 'general', icono: 'pi-bookmark' },
      { nombre: 'pza', descripcion: 'Pieza', categoria: 'general', icono: 'pi-bookmark' },
      { nombre: 'kg', descripcion: 'Kilogramo', categoria: 'peso', icono: 'pi-circle' },
      { nombre: 'g', descripcion: 'Gramo', categoria: 'peso', icono: 'pi-circle' },
      { nombre: 'lb', descripcion: 'Libra', categoria: 'peso', icono: 'pi-circle' },
      { nombre: 'lt', descripcion: 'Litro', categoria: 'volumen', icono: 'pi-box' },
      { nombre: 'ml', descripcion: 'Mililitro', categoria: 'volumen', icono: 'pi-box' },
      { nombre: 'gl', descripcion: 'Galón', categoria: 'volumen', icono: 'pi-box' },
      { nombre: 'mt', descripcion: 'Metro', categoria: 'longitud', icono: 'pi-arrows-h' },
      { nombre: 'cm', descripcion: 'Centímetro', categoria: 'longitud', icono: 'pi-arrows-h' },
      { nombre: 'mm', descripcion: 'Milímetro', categoria: 'longitud', icono: 'pi-arrows-h' },
      { nombre: 'in', descripcion: 'Pulgada', categoria: 'longitud', icono: 'pi-arrows-h' },
      { nombre: 'ft', descripcion: 'Pie', categoria: 'longitud', icono: 'pi-arrows-h' },
      { nombre: 'caja', descripcion: 'Caja', categoria: 'empaque', icono: 'pi-box' },
      { nombre: 'paquete', descripcion: 'Paquete', categoria: 'empaque', icono: 'pi-box' },
      { nombre: 'docena', descripcion: 'Docena (12 unidades)', categoria: 'empaque', icono: 'pi-box' },
      { nombre: 'par', descripcion: 'Par (2 unidades)', categoria: 'empaque', icono: 'pi-box' },
      { nombre: 'rollo', descripcion: 'Rollo', categoria: 'empaque', icono: 'pi-circle' }
    ];
  }

  /**
   * Valida el formato del nombre de la unidad
   */
  validateNombreFormat(nombre: string): { valid: boolean; message?: string } {
    if (!nombre) {
      return { valid: false, message: 'El nombre es requerido' };
    }

    if (nombre.length > 50) {
      return { valid: false, message: 'El nombre no debe exceder 50 caracteres' };
    }

    // Permitir solo letras, números y algunos caracteres especiales
    const validFormat = /^[a-zA-Z0-9]+[a-zA-Z0-9\-_.]*[a-zA-Z0-9]*$/.test(nombre);
    if (!validFormat) {
      return { 
        valid: false, 
        message: 'El nombre solo puede contener letras, números, guiones, puntos y guiones bajos' 
      };
    }

    return { valid: true };
  }

  /**
   * Obtiene el icono apropiado para una unidad según su nombre/categoría
   */
  getIconoParaUnidad(nombre: string): string {
    const nombreLower = nombre.toLowerCase();
    
    // Peso
    if (['kg', 'g', 'lb', 'oz', 'ton'].includes(nombreLower)) {
      return 'pi-circle';
    }
    
    // Volumen
    if (['lt', 'l', 'ml', 'gl', 'gal'].includes(nombreLower)) {
      return 'pi-box';
    }
    
    // Longitud
    if (['mt', 'm', 'cm', 'mm', 'km', 'in', 'ft', 'yd'].includes(nombreLower)) {
      return 'pi-arrows-h';
    }
    
    // Empaque
    if (['caja', 'paquete', 'docena', 'par', 'rollo'].includes(nombreLower)) {
      return 'pi-box';
    }
    
    // Área
    if (['m2', 'cm2', 'km2', 'hectarea', 'acre'].includes(nombreLower)) {
      return 'pi-stop';
    }
    
    // Tiempo
    if (['hora', 'min', 'seg', 'dia', 'mes', 'año'].includes(nombreLower)) {
      return 'pi-clock';
    }
    
    // Por defecto
    return 'pi-bookmark';
  }
}