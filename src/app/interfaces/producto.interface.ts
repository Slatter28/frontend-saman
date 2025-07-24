export interface Producto {
  id: number;
  codigo: string;
  descripcion: string;
  activo?: boolean;
  creadoEn: string;
  unidadMedida: UnidadMedida;
}

export interface UnidadMedida {
  id: number;
  nombre: string;
  descripcion: string;
}

export interface CreateProductoDto {
  codigo: string;
  descripcion: string;
  unidadMedidaId: number;
}

export interface UpdateProductoDto {
  codigo?: string;
  descripcion?: string;
  unidadMedidaId?: number;
}

export interface ProductosResponse {
  data: Producto[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ProductosFilter {
  page?: number;
  limit?: number;
  codigo?: string;
  descripcion?: string;
  unidadMedidaId?: number;
}

export interface MovimientoProducto {
  id: number;
  tipo: 'entrada' | 'salida';
  cantidad: number;
  fecha: string;
  observacion: string;
  bodega: {
    id: number;
    nombre: string;
  };
  usuario: {
    id: number;
    nombre: string;
  };
  cliente: {
    id: number;
    nombre: string;
  };
}

export interface ProductoMovimientos {
  codigo: string;
  movimientos: MovimientoProducto[];
  totalMovimientos: number;
}

export interface KardexItem {
  id: number;
  fecha: string;
  tipo: 'entrada' | 'salida';
  cantidad: number;
  saldo: number;
  observacion: string;
  bodega: {
    id: number;
    nombre: string;
  };
  usuario: {
    id: number;
    nombre: string;
  };
  cliente: {
    id: number;
    nombre: string;
  };
}

export interface ProductoKardex {
  producto: {
    id: number;
    codigo: string;
    descripcion: string;
    unidadMedida: string;
  };
  kardex: KardexItem[];
  stockActual: number;
  totalMovimientos: number;
}

export interface ProductoTableColumn {
  field: string;
  header: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
}

export interface ProductoFilterEvent {
  filters: any;
  first: number;
  rows: number;
  sortField?: string;
  sortOrder?: number;
}