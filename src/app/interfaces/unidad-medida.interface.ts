// Unidad de Medida interfaces
export interface UnidadMedida {
  id: number;
  nombre: string;
  descripcion?: string;
  creadoEn?: string;
  actualizadoEn?: string;
}

// DTO para crear unidad de medida
export interface CreateUnidadMedidaDto {
  nombre: string;
  descripcion?: string;
}

// DTO para actualizar unidad de medida
export interface UpdateUnidadMedidaDto {
  nombre?: string;
  descripcion?: string;
}

// Respuesta de la API para la lista de unidades
export interface UnidadesMedidaResponse {
  data: UnidadMedida[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Filtros para buscar unidades de medida
export interface UnidadMedidaFilters {
  nombre?: string;
  page?: number;
  limit?: number;
}

// Producto asociado a una unidad de medida
export interface ProductoAsociado {
  id: number;
  codigo: string;
  descripcion: string;
}

// Detalle de unidad de medida con productos asociados
export interface UnidadMedidaDetalle extends UnidadMedida {
  productos: ProductoAsociado[];
  cantidadProductos?: number;
}

// Estadísticas de unidades de medida
export interface UnidadesMedidaStats {
  totalUnidades: number;
  unidadesSinUso: number;
  unidadesMasUsadas: Array<{
    unidad: UnidadMedida;
    cantidadProductos: number;
  }>;
}

// Unidades predefinidas para importación rápida
export interface UnidadPredefinida {
  nombre: string;
  descripcion: string;
  icono?: string;
  categoria: 'general' | 'peso' | 'volumen' | 'longitud' | 'empaque';
}

// Opciones para el selector de vista
export type VistaUnidades = 'tabla' | 'tarjetas';

// Modo del formulario
export type ModoFormulario = 'crear' | 'editar';