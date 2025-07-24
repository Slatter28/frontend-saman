export interface Bodega {
  id: number;
  nombre: string;
  ubicacion: string;
  movimientos?: any[];
}

export interface BodegaCreate {
  nombre: string;
  ubicacion?: string;
}

export interface BodegaUpdate {
  nombre?: string;
  ubicacion?: string;
}

export interface BodegasResponse {
  data: Bodega[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface BodegaInventario {
  bodega: Bodega;
  inventario: ProductoInventario[];
  totalProductos: number;
}

export interface ProductoInventario {
  producto: {
    id: number;
    codigo: string;
    descripcion: string;
    unidadMedida: string;
  };
  stock: number;
}

export interface BodegaFilters {
  nombre?: string;
  ubicacion?: string;
  page?: number;
  limit?: number;
}