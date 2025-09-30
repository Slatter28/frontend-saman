import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, map, tap, switchMap } from 'rxjs/operators';
import { OfflineService } from './offline.service';
import { environment } from '../../environments/environment';
import {
  Movimiento,
  MovimientosResponse,
  MovimientosFilter,
  CreateEntradaDto,
  CreateSalidaDto,
  UpdateMovimientoDto,
  InventarioResponse,
  ProductoKardex,
  StockPorBodega,
  EstadisticasMovimientos,
  AlertaStock,
  MovimientoExportOptions
} from '../interfaces/movimiento.interface';

@Injectable({
  providedIn: 'root'
})
export class MovimientosService {
  private readonly apiUrl = `${environment.apiUrl}/movimientos`;
  
  // Cache y estado
  private movimientosCache$ = new BehaviorSubject<Movimiento[]>([]);
  private inventarioCache$ = new BehaviorSubject<InventarioResponse | null>(null);
  private loadingSubject$ = new BehaviorSubject<boolean>(false);
  private errorSubject$ = new BehaviorSubject<string | null>(null);

  // Observables públicos
  public readonly movimientos$ = this.movimientosCache$.asObservable();
  public readonly inventario$ = this.inventarioCache$.asObservable();
  public readonly loading$ = this.loadingSubject$.asObservable();
  public readonly error$ = this.errorSubject$.asObservable();

  constructor(
    private http: HttpClient,
    private offlineService: OfflineService
  ) {}

  // Método principal para obtener movimientos con filtros
  getMovimientos(filtros: MovimientosFilter): Observable<MovimientosResponse> {
    this.setLoading(true);
    this.clearError();

    let params = new HttpParams()
      .set('page', filtros.page.toString())
      .set('limit', filtros.limit.toString());

    if (filtros.tipo) params = params.set('tipo', filtros.tipo);
    if (filtros.productoId) params = params.set('productoId', filtros.productoId.toString());
    if (filtros.productoCodigo) params = params.set('productoCodigo', filtros.productoCodigo);
    if (filtros.bodegaId) params = params.set('bodegaId', filtros.bodegaId.toString());
    if (filtros.clienteId) params = params.set('clienteId', filtros.clienteId.toString());
    if (filtros.fechaDesde) params = params.set('fechaDesde', filtros.fechaDesde);
    if (filtros.fechaHasta) params = params.set('fechaHasta', filtros.fechaHasta);
    if (filtros.usuarioId) params = params.set('usuarioId', filtros.usuarioId.toString());
    if (filtros.search) params = params.set('search', filtros.search);

    const cacheKey = `movimientos_${JSON.stringify(filtros)}`;
    const httpRequest = this.http.get<MovimientosResponse>(this.apiUrl, { params });

    // Datos por defecto cuando no hay cache
    const defaultResponse: MovimientosResponse = {
      data: [],
      meta: {
        total: 0,
        page: filtros.page || 1,
        limit: filtros.limit || 10,
        totalPages: 0
      }
    };

    return this.offlineService.cacheFirstRequest(cacheKey, httpRequest, 1 * 60 * 1000, defaultResponse).pipe(
      map(response => {
        // Si estamos usando datos por defecto (vacíos) y estamos offline, 
        // intentar recuperar movimientos offline del cache
        if (response.data.length === 0 && !this.offlineService.isOnline) {
          const offlineMovimientos = this.getOfflineMovimientos(filtros);
          if (offlineMovimientos.length > 0) {
            return {
              ...response,
              data: offlineMovimientos,
              meta: {
                ...response.meta,
                total: offlineMovimientos.length
              }
            };
          }
        }
        return response;
      }),
      tap(response => {
        this.movimientosCache$.next(response.data);
        this.setLoading(false);
      }),
      catchError(error => this.handleError(error))
    );
  }

  // Crear entrada de inventario
  createEntrada(entrada: CreateEntradaDto): Observable<Movimiento> {
    this.setLoading(true);
    this.clearError();

    return this.offlineService.onlineOnlyRequest<Movimiento>(
      'POST',
      `${this.apiUrl}/entrada`,
      entrada,
      `Crear entrada: ${entrada.cantidad} unidades`
    ).pipe(
      map(movimiento => {
        // Si es una operación offline, enriquecer los datos
        if ((movimiento as any)._offline) {
          return this.enrichOfflineMovimiento(movimiento, entrada, 'entrada');
        }
        return movimiento;
      }),
      tap(movimiento => {
        // Agregar al cache interno
        this.addMovimientoToCache(movimiento);
        
        // Si es una operación offline, también actualizar el cache persistente
        if ((movimiento as any)._offline) {
          this.updateOfflineCache(movimiento, 'entrada');
        }
        
        this.invalidateInventarioCache();
        this.setLoading(false);
      }),
      catchError(error => this.handleError(error))
    );
  }

  // Crear salida de inventario
  createSalida(salida: CreateSalidaDto): Observable<Movimiento> {
    this.setLoading(true);
    this.clearError();

    return this.offlineService.onlineOnlyRequest<Movimiento>(
      'POST',
      `${this.apiUrl}/salida`,
      salida,
      `Crear salida: ${salida.cantidad} unidades`
    ).pipe(
      map(movimiento => {
        // Si es una operación offline, enriquecer los datos
        if ((movimiento as any)._offline) {
          return this.enrichOfflineMovimiento(movimiento, salida, 'salida');
        }
        return movimiento;
      }),
      tap(movimiento => {
        // Agregar al cache interno
        this.addMovimientoToCache(movimiento);
        
        // Si es una operación offline, también actualizar el cache persistente
        if ((movimiento as any)._offline) {
          this.updateOfflineCache(movimiento, 'salida');
        }
        
        this.invalidateInventarioCache();
        this.setLoading(false);
      }),
      catchError(error => this.handleError(error))
    );
  }

  // Obtener inventario general
getInventario(filtros?: { 
  bodegaId?: number; 
  productoId?: number; 
  stockMinimo?: number;
  soloStockBajo?: boolean;
  incluirCeros?: boolean;
}): Observable<any> {
  this.setLoading(true);
  this.clearError();

  let params = new HttpParams();
  
  if (filtros?.bodegaId) {
    params = params.set('bodegaId', filtros.bodegaId.toString());
  }
  if (filtros?.productoId) {
    params = params.set('productoId', filtros.productoId.toString());
  }
  if (filtros?.stockMinimo) {
    params = params.set('stockMinimo', filtros.stockMinimo.toString());
  }
  if (filtros?.soloStockBajo) {
    params = params.set('soloStockBajo', 'true');
  }
  if (filtros?.incluirCeros) {
    params = params.set('incluirCeros', 'true');
  }

  const cacheKey = `inventario_${JSON.stringify(filtros || {})}`;
  const httpRequest = this.http.get<any>(`${this.apiUrl}/inventario`, { params });

  // Datos por defecto para inventario
  const defaultInventario = {
    data: [],
    meta: {
      total: 0,
      totalValue: 0,
      totalStock: 0
    },
    message: 'Sin conexión - Datos no disponibles'
  };

  return this.offlineService.cacheFirstRequest(cacheKey, httpRequest, 2 * 60 * 1000, defaultInventario).pipe(
    tap(inventario => {
      this.inventarioCache$.next(inventario);
      this.setLoading(false);
    }),
    catchError(error => this.handleError(error))
  );
}

  // Obtener movimientos por código de producto
  getMovimientosByProductoCodigo(codigo: string): Observable<Movimiento[]> {
    this.setLoading(true);
    this.clearError();

    const cacheKey = `movimientos_by_codigo_${codigo}`;
    const httpRequest = this.http.get<Movimiento[]>(`${this.apiUrl}/producto/${codigo}`);
    
    return this.offlineService.cacheFirstRequest(cacheKey, httpRequest, 1 * 60 * 1000, []).pipe(
      tap(() => this.setLoading(false)),
      catchError(error => this.handleError(error))
    );
  }

  // Obtener kardex de producto
  getKardexProducto(productId: number, filtros?: {
    fechaDesde?: string;
    fechaHasta?: string;
    bodegaId?: number;
    tipo?: 'entrada' | 'salida';
  }): Observable<ProductoKardex> {
    this.setLoading(true);
    this.clearError();

    let params = new HttpParams();
    if (filtros?.fechaDesde) params = params.set('fechaDesde', filtros.fechaDesde);
    if (filtros?.fechaHasta) params = params.set('fechaHasta', filtros.fechaHasta);
    if (filtros?.bodegaId) params = params.set('bodegaId', filtros.bodegaId.toString());
    if (filtros?.tipo) params = params.set('tipo', filtros.tipo);

    const cacheKey = `kardex_${productId}_${JSON.stringify(filtros || {})}`;
    const httpRequest = this.http.get<ProductoKardex>(`${this.apiUrl}/kardex/${productId}`, { params });
    
    return this.offlineService.cacheFirstRequest(cacheKey, httpRequest, 1 * 60 * 1000).pipe(
      tap(() => this.setLoading(false)),
      catchError(error => this.handleError(error))
    );
  }

  // Obtener detalle de movimiento
  getMovimiento(id: number): Observable<Movimiento> {
    this.setLoading(true);
    this.clearError();

    const cacheKey = `movimiento_${id}`;
    const httpRequest = this.http.get<Movimiento>(`${this.apiUrl}/${id}`);
    
    return this.offlineService.cacheFirstRequest(cacheKey, httpRequest, 5 * 60 * 1000).pipe(
      tap(() => this.setLoading(false)),
      catchError(error => this.handleError(error))
    );
  }

  // Actualizar movimiento (solo admin)
  updateMovimiento(id: number, update: UpdateMovimientoDto): Observable<Movimiento> {
    this.setLoading(true);
    this.clearError();

    return this.http.patch<Movimiento>(`${this.apiUrl}/${id}`, update).pipe(
      tap(movimiento => {
        this.updateMovimientoInCache(movimiento);
        this.invalidateInventarioCache();
        this.setLoading(false);
      }),
      catchError(error => this.handleError(error))
    );
  }

  // Eliminar movimiento (solo admin)
  deleteMovimiento(id: number): Observable<void> {
    this.setLoading(true);
    this.clearError();

    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this.removeMovimientoFromCache(id);
        this.invalidateInventarioCache();
        this.setLoading(false);
      }),
      catchError(error => this.handleError(error))
    );
  }

  // Verificar stock disponible
  verificarStock(productoId: number, bodegaId: number): Observable<StockPorBodega[]> {
    const params = new HttpParams()
      .set('productoId', productoId.toString())
      .set('bodegaId', bodegaId.toString());

    return this.http.get<StockPorBodega[]>(`${this.apiUrl}/stock`, { params }).pipe(
      catchError(error => this.handleError(error))
    );
  }

  // Obtener stock de producto por todas las bodegas
  getStockPorBodegas(productoId: number): Observable<StockPorBodega[]> {
    return this.http.get<StockPorBodega[]>(`${this.apiUrl}/stock/${productoId}`).pipe(
      catchError(error => this.handleError(error))
    );
  }

  // Obtener estadísticas de movimientos
  getEstadisticas(periodo?: 'dia' | 'semana' | 'mes' | 'año'): Observable<EstadisticasMovimientos> {
    let params = new HttpParams();
    if (periodo) params = params.set('periodo', periodo);

    return this.http.get<EstadisticasMovimientos>(`${this.apiUrl}/estadisticas`, { params }).pipe(
      catchError(error => this.handleError(error))
    );
  }

  // Obtener alertas de stock
  getAlertasStock(): Observable<AlertaStock[]> {
    return this.http.get<AlertaStock[]>(`${this.apiUrl}/alertas/stock`).pipe(
      catchError(error => this.handleError(error))
    );
  }

  // Exportar movimientos
  exportarMovimientos(options: MovimientoExportOptions): Observable<Blob> {
    const params = new HttpParams({ fromObject: options as any });
    
    return this.http.get(`${this.apiUrl}/export`, { 
      params, 
      responseType: 'blob' 
    }).pipe(
      catchError(error => this.handleError(error))
    );
  }

  // Duplicar movimiento
  duplicarMovimiento(id: number): Observable<Movimiento> {
    this.setLoading(true);
    this.clearError();

    return this.http.post<Movimiento>(`${this.apiUrl}/${id}/duplicate`, {}).pipe(
      tap(movimiento => {
        this.addMovimientoToCache(movimiento);
        this.invalidateInventarioCache();
        this.setLoading(false);
      }),
      catchError(error => this.handleError(error))
    );
  }

  // Validar movimiento antes de crear
  validarMovimiento(movimiento: CreateEntradaDto | CreateSalidaDto, tipo: 'entrada' | 'salida'): Observable<{
    valido: boolean;
    errores: string[];
    advertencias: string[];
    stockDisponible?: number;
    stockNuevo?: number;
  }> {
    const body = { ...movimiento, tipo };
    
    return this.http.post<any>(`${this.apiUrl}/validar`, body).pipe(
      catchError(error => this.handleError(error))
    );
  }

  // Obtener movimientos recientes para sugerencias
  getMovimientosRecientes(limit: number = 10): Observable<Movimiento[]> {
    const params = new HttpParams().set('limit', limit.toString());
    
    return this.http.get<Movimiento[]>(`${this.apiUrl}/recientes`, { params }).pipe(
      catchError(error => this.handleError(error))
    );
  }

  // Obtener plantillas de movimientos frecuentes
  getPlantillasMovimientos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/plantillas`).pipe(
      catchError(error => this.handleError(error))
    );
  }

  // Métodos de utilidad
  private setLoading(loading: boolean): void {
    this.loadingSubject$.next(loading);
  }

  private clearError(): void {
    this.errorSubject$.next(null);
  }

  private setError(error: string): void {
    this.errorSubject$.next(error);
    this.setLoading(false);
  }

  private handleError(error: any): Observable<never> {
    let errorMessage = 'Ha ocurrido un error inesperado';
    
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    this.setError(errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  private addMovimientoToCache(movimiento: Movimiento): void {
    const current = this.movimientosCache$.value;
    this.movimientosCache$.next([movimiento, ...current]);
  }

  /**
   * Actualizar cache persistente con movimientos offline
   */
  private updateOfflineCache(movimiento: Movimiento, tipo: 'entrada' | 'salida'): void {
    try {
      // Obtener los filtros actuales más comunes para actualizar esos caches
      const commonFilters = [
        { page: 1, limit: 10 },
        { page: 1, limit: 10, tipo: tipo },
        { page: 1, limit: 20 },
        { page: 1, limit: 50 }
      ];

      commonFilters.forEach(filtros => {
        const cacheKey = `movimientos_${JSON.stringify(filtros)}`;
        const existingData = this.offlineService.getData(cacheKey, 24 * 60 * 60 * 1000); // 24 horas

        if (existingData) {
          // Agregar el nuevo movimiento al cache existente
          const updatedData = {
            ...existingData,
            data: [movimiento, ...existingData.data.slice(0, (filtros.limit || 10) - 1)],
            meta: {
              ...existingData.meta,
              total: existingData.meta.total + 1
            }
          };
          
          this.offlineService.storeData(cacheKey, updatedData);
          console.log(`📦 Cache actualizado para filtros:`, filtros);
        } else {
          // Si no hay cache existente, crear uno nuevo con el movimiento
          const newData = {
            data: [movimiento],
            meta: {
              total: 1,
              page: filtros.page || 1,
              limit: filtros.limit || 10,
              totalPages: 1
            }
          };
          
          this.offlineService.storeData(cacheKey, newData);
          console.log(`📦 Cache creado para filtros:`, filtros);
        }
      });

    } catch (error) {
      console.error('Error actualizando cache offline:', error);
    }
  }

  /**
   * Obtener movimientos offline del cache
   */
  private getOfflineMovimientos(filtros: MovimientosFilter): Movimiento[] {
    try {
      // Intentar obtener de diferentes caches con los filtros dados
      const possibleCacheKeys = [
        `movimientos_${JSON.stringify(filtros)}`,
        `movimientos_${JSON.stringify({ page: 1, limit: 10 })}`,
        `movimientos_${JSON.stringify({ page: 1, limit: 10, tipo: filtros.tipo })}`,
      ];

      for (const cacheKey of possibleCacheKeys) {
        const cachedData = this.offlineService.getData(cacheKey, 24 * 60 * 60 * 1000);
        if (cachedData && cachedData.data && cachedData.data.length > 0) {
          console.log(`📦 Recuperando movimientos offline desde: ${cacheKey}`);
          
          // Filtrar según los criterios actuales
          let movimientos = cachedData.data;
          
          if (filtros.tipo) {
            movimientos = movimientos.filter((m: Movimiento) => m.tipo === filtros.tipo);
          }
          
          if (filtros.search) {
            const searchTerm = filtros.search.toLowerCase();
            movimientos = movimientos.filter((m: any) => 
              (m.observaciones?.toLowerCase().includes(searchTerm)) ||
              (m.producto?.codigo?.toLowerCase().includes(searchTerm)) ||
              (m.producto?.descripcion?.toLowerCase().includes(searchTerm))
            );
          }
          
          // Aplicar paginación
          const limit = filtros.limit || 10;
          const offset = ((filtros.page || 1) - 1) * limit;
          
          return movimientos.slice(offset, offset + limit);
        }
      }
      
      return [];
    } catch (error) {
      console.error('Error obteniendo movimientos offline:', error);
      return [];
    }
  }

  /**
   * Enriquecer datos de movimiento offline con información completa
   */
  private enrichOfflineMovimiento(movimiento: any, data: any, tipo: 'entrada' | 'salida'): Movimiento {
    return {
      ...movimiento,
      tipo: tipo,
      cantidad: data.cantidad,
      fechaMovimiento: data.fechaMovimiento || new Date().toISOString(),
      observaciones: data.observaciones || '',
      usuario: {
        id: 1,
        nombre: 'Usuario Offline'
      },
      producto: {
        id: data.productoId || 0,
        codigo: data.productoCodigo || 'SIN-CODIGO',
        descripcion: data.productoDescripcion || 'Producto sin descripción',
        unidadMedida: {
          id: 1,
          nombre: 'und',
          descripcion: 'Unidad'
        }
      },
      bodega: {
        id: data.bodegaId || 0,
        nombre: data.bodegaNombre || 'Bodega sin nombre',
        ubicacion: 'Sin ubicación'
      },
      cliente: data.clienteId ? {
        id: data.clienteId,
        nombre: data.clienteNombre || 'Cliente sin nombre',
        tipo: 'cliente' as any
      } : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as Movimiento;
  }

  private updateMovimientoInCache(movimiento: Movimiento): void {
    const current = this.movimientosCache$.value;
    const index = current.findIndex(m => m.id === movimiento.id);
    if (index !== -1) {
      current[index] = movimiento;
      this.movimientosCache$.next([...current]);
    }
  }

  private removeMovimientoFromCache(id: number): void {
    const current = this.movimientosCache$.value;
    this.movimientosCache$.next(current.filter(m => m.id !== id));
  }

  private invalidateInventarioCache(): void {
    this.inventarioCache$.next(null);
  }

  // Limpiar cache
  clearCache(): void {
    this.movimientosCache$.next([]);
    this.inventarioCache$.next(null);
    this.clearError();
  }

  // Refrescar datos
  refresh(): void {
    this.clearCache();
  }

  // Descargar Excel de movimientos
  downloadExcel(filtros?: MovimientosFilter): Observable<Blob> {
    this.setLoading(true);
    this.clearError();

    console.log('Filtros originales para Excel:', filtros);
    
    // PRUEBA: Primero intentemos sin parámetros para descartar error del endpoint
    console.log('Intentando descarga sin parámetros...');
    console.log('URL:', `${this.apiUrl}/excel`);
    
    return this.http.get(`${this.apiUrl}/excel`, { 
      responseType: 'blob',
      observe: 'response'
    }).pipe(
      map(response => {
        this.setLoading(false);
        console.log('Respuesta exitosa SIN parámetros:', response);
        return response.body as Blob;
      }),
      catchError(error => {
        console.error('Error SIN parámetros:', error);
        console.error('Status:', error.status);
        console.error('Status text:', error.statusText);
        console.error('Error body:', error.error);
        
        // Intentar leer el error blob como texto
        if (error.error instanceof Blob) {
          error.error.text().then((text: string) => {
            console.error('Error body text SIN parámetros:', text);
          });
        }
        
        this.setLoading(false);
        return throwError(() => error);
      })
    );
  }

  // Descargar Excel de inventario
  downloadInventarioExcel(bodegaId?: number): Observable<Blob> {
    this.setLoading(true);
    this.clearError();

    let params = new HttpParams();
    
    if (bodegaId && !isNaN(Number(bodegaId))) {
      params = params.set('bodegaId', bodegaId.toString());
    }
    
    console.log('Descargando inventario Excel con parámetros:', params.toString());
    console.log('URL:', `${this.apiUrl}/inventario-excel`);
    
    return this.http.get(`${this.apiUrl}/inventario-excel`, { 
      params,
      responseType: 'blob',
      observe: 'response'
    }).pipe(
      map(response => {
        this.setLoading(false);
        console.log('Inventario Excel descargado exitosamente:', response);
        return response.body as Blob;
      }),
      catchError(error => {
        console.error('Error descargando inventario Excel:', error);
        
        if (error.error instanceof Blob) {
          error.error.text().then((text: string) => {
            console.error('Error body text:', text);
          });
        }
        
        this.setLoading(false);
        return throwError(() => error);
      })
    );
  }
}