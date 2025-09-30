import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { OfflineService } from './offline.service';
import { environment } from '../../environments/environment';
import {
  Producto,
  ProductosResponse,
  ProductosFilter,
  CreateProductoDto,
  UpdateProductoDto,
  ProductoMovimientos,

} from '../interfaces/producto.interface';
import { ProductoKardex } from '../interfaces/movimiento.interface';

@Injectable({
  providedIn: 'root'
})
export class ProductosService {
  private readonly apiUrl = `${environment.apiUrl}/productos`;
  private readonly movimientosUrl = `${environment.apiUrl}/movimientos`;
  
  private filtrosSubject = new BehaviorSubject<ProductosFilter>({});
  public filtros$ = this.filtrosSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  constructor(
    private http: HttpClient,
    private offlineService: OfflineService
  ) {}

  // Obtener lista de productos con filtros y paginación
  getProductos(filtros: ProductosFilter = {}): Observable<ProductosResponse> {
    this.loadingSubject.next(true);
    
    let params = new HttpParams();
    
    if (filtros.page) {
      params = params.set('page', filtros.page.toString());
    }
    if (filtros.limit) {
      params = params.set('limit', filtros.limit.toString());
    }
    if (filtros.codigo) {
      params = params.set('codigo', filtros.codigo);
    }
    if (filtros.descripcion) {
      params = params.set('descripcion', filtros.descripcion);
    }
    if (filtros.unidadMedidaId) {
      params = params.set('unidadMedidaId', filtros.unidadMedidaId.toString());
    }

    const cacheKey = `productos_${JSON.stringify(filtros)}`;
    const httpRequest = this.http.get<ProductosResponse>(this.apiUrl, { params });

    return this.offlineService.cacheFirstRequest(cacheKey, httpRequest, 2 * 60 * 1000).pipe(
      map(response => {
        this.loadingSubject.next(false);
        this.filtrosSubject.next(filtros);
        return response;
      })
    );
  }

  // Obtener producto por ID
  getProducto(id: number): Observable<Producto> {
    const cacheKey = `producto_${id}`;
    const httpRequest = this.http.get<Producto>(`${this.apiUrl}/${id}`);
    return this.offlineService.cacheFirstRequest(cacheKey, httpRequest, 5 * 60 * 1000);
  }

  // Crear nuevo producto
  createProducto(producto: CreateProductoDto): Observable<Producto> {
    return this.offlineService.onlineOnlyRequest<Producto>(
      'POST',
      this.apiUrl,
      producto,
      `Crear producto: ${producto.descripcion}`
    );
  }

  // Actualizar producto
  updateProducto(id: number, producto: UpdateProductoDto): Observable<Producto> {
    return this.offlineService.onlineOnlyRequest<Producto>(
      'PATCH',
      `${this.apiUrl}/${id}`,
      producto,
      `Actualizar producto ID: ${id}`
    );
  }

  // Eliminar producto
  deleteProducto(id: number): Observable<void> {
    return this.offlineService.onlineOnlyRequest<void>(
      'DELETE',
      `${this.apiUrl}/${id}`,
      undefined,
      `Eliminar producto ID: ${id}`
    );
  }

  // Obtener movimientos de un producto por código
  getMovimientosProducto(codigo: string): Observable<ProductoMovimientos> {
    const cacheKey = `movimientos_producto_${codigo}`;
    const httpRequest = this.http.get<ProductoMovimientos>(`${this.movimientosUrl}/producto/${codigo}`);
    return this.offlineService.cacheFirstRequest(cacheKey, httpRequest, 1 * 60 * 1000);
  }

  // Obtener kardex de un producto
  getKardexProducto(productId: number): Observable<ProductoKardex> {
    const cacheKey = `kardex_producto_${productId}`;
    const httpRequest = this.http.get<ProductoKardex>(`${this.movimientosUrl}/kardex/${productId}`);
    return this.offlineService.cacheFirstRequest(cacheKey, httpRequest, 1 * 60 * 1000);
  }

  // Verificar si un código de producto existe
  verificarCodigoUnico(codigo: string, excludeId?: number): Observable<boolean> {
    let params = new HttpParams().set('codigo', codigo);
    if (excludeId) {
      params = params.set('excludeId', excludeId.toString());
    }
    
    return this.http.get<{ existe: boolean }>(`${this.apiUrl}/verificar-codigo`, { params })
      .pipe(map(response => !response.existe));
  }

  // Obtener sugerencias de códigos
  getSugerenciasCodigo(termino: string): Observable<string[]> {
    const params = new HttpParams().set('termino', termino);
    return this.http.get<{ sugerencias: string[] }>(`${this.apiUrl}/sugerencias-codigo`, { params })
      .pipe(map(response => response.sugerencias));
  }

  // Búsqueda de productos con debounce
  buscarProductos(termino: string): Observable<Producto[]> {
    if (!termino.trim()) {
      return new Observable(observer => observer.next([]));
    }

    const params = new HttpParams()
      .set('busqueda', termino)
      .set('limit', '10');

    return this.http.get<ProductosResponse>(`${this.apiUrl}/buscar`, { params })
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        map(response => response.data)
      );
  }

  // Exportar productos a Excel
  exportarExcel(filtros: ProductosFilter = {}): Observable<Blob> {
    let params = new HttpParams();
    
    Object.keys(filtros).forEach(key => {
      const value = (filtros as any)[key];
      if (value !== null && value !== undefined) {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get(`${this.apiUrl}/exportar/excel`, {
      params,
      responseType: 'blob'
    });
  }

  // Exportar productos a PDF
  exportarPDF(filtros: ProductosFilter = {}): Observable<Blob> {
    let params = new HttpParams();
    
    Object.keys(filtros).forEach(key => {
      const value = (filtros as any)[key];
      if (value !== null && value !== undefined) {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get(`${this.apiUrl}/exportar/pdf`, {
      params,
      responseType: 'blob'
    });
  }

  // Importar productos desde Excel
  importarExcel(file: File): Observable<{ procesados: number; errores: any[] }> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<{ procesados: number; errores: any[] }>(`${this.apiUrl}/importar/excel`, formData);
  }

  // Obtener plantilla de importación
  descargarPlantilla(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/plantilla/excel`, { responseType: 'blob' });
  }

  // Obtener estadísticas de productos
  getEstadisticas(): Observable<{
    totalProductos: number;
    productosActivos: number;
    unidadesMedidaUsadas: number;
    ultimaActualizacion: string;
  }> {
    return this.http.get<any>(`${this.apiUrl}/estadisticas`);
  }

  // Limpiar filtros
  limpiarFiltros(): void {
    this.filtrosSubject.next({});
  }

  // Actualizar filtros
  actualizarFiltros(filtros: ProductosFilter): void {
    this.filtrosSubject.next({ ...this.filtrosSubject.value, ...filtros });
  }

  // Obtener filtros actuales
  getFiltrosActuales(): ProductosFilter {
    return this.filtrosSubject.value;
  }

  // Método para manejar errores de formulario
  private handleFormError(error: any): string {
    if (error.error?.message) {
      return error.error.message;
    }
    
    if (error.error?.errors) {
      const firstError = Object.values(error.error.errors)[0];
      return Array.isArray(firstError) ? firstError[0] : firstError as string;
    }
    
    return 'Ha ocurrido un error inesperado';
  }
}