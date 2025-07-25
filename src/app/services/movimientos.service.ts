import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
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

  constructor(private http: HttpClient) {}

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

    return this.http.get<MovimientosResponse>(this.apiUrl, { params }).pipe(
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

    return this.http.post<Movimiento>(`${this.apiUrl}/entrada`, entrada).pipe(
      tap(movimiento => {
        this.addMovimientoToCache(movimiento);
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

    return this.http.post<Movimiento>(`${this.apiUrl}/salida`, salida).pipe(
      tap(movimiento => {
        this.addMovimientoToCache(movimiento);
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

  return this.http.get<any>(`${this.apiUrl}/inventario`, { params }).pipe(
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

    return this.http.get<Movimiento[]>(`${this.apiUrl}/producto/${codigo}`).pipe(
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

    return this.http.get<ProductoKardex>(`${this.apiUrl}/kardex/${productId}`, { params }).pipe(
      tap(() => this.setLoading(false)),
      catchError(error => this.handleError(error))
    );
  }

  // Obtener detalle de movimiento
  getMovimiento(id: number): Observable<Movimiento> {
    this.setLoading(true);
    this.clearError();

    return this.http.get<Movimiento>(`${this.apiUrl}/${id}`).pipe(
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
}