export type TipoCliente = 'cliente' | 'proveedor' | 'ambos';

export interface Cliente {
  id: number;
  nombre: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  tipo: TipoCliente;
  creadoEn: string;
}

export interface ClienteDetalle extends Cliente {
  movimientos?: MovimientoCliente[];
}

export interface CreateClienteDto {
  nombre: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  tipo: TipoCliente;
}

export interface UpdateClienteDto extends Partial<CreateClienteDto> {
  id: number;
}

export interface ClientesResponse {
  data: Cliente[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ClienteFilters {
  page?: number;
  limit?: number;
  nombre?: string;
  email?: string;
  tipo?: TipoCliente;
}

export interface MovimientoCliente {
  id: number;
  tipo: 'entrada' | 'salida';
  cantidad: number;
  precio_unitario: number;
  precio_total: number;
  fecha: string;
  observacion?: string;
  producto: {
    id: number;
    codigo: string;
    descripcion: string;
  };
  bodega: {
    id: number;
    nombre: string;
  };
  usuario: {
    id: number;
    nombre: string;
  };
}

export interface ClienteMovimientosResponse {
  cliente: {
    id: number;
    nombre: string;
    tipo: TipoCliente;
    email?: string;
    telefono?: string;
  };
  movimientos: MovimientoCliente[];
  totalMovimientos: number;
}

export interface ClienteStats {
  totalClientes: number;
  totalProveedores: number;
  totalAmbos: number;
  total: number;
}

export const TipoClienteLabels: Record<TipoCliente, string> = {
  'cliente': 'Cliente',
  'proveedor': 'Proveedor',
  'ambos': 'Cliente y Proveedor'
};

export const TipoClienteColors: Record<TipoCliente, 'info' | 'success' | 'secondary'> = {
  'cliente': 'info',
  'proveedor': 'success',
  'ambos': 'secondary'
};

export const TipoClienteIcons: Record<TipoCliente, string> = {
  'cliente': 'pi-user',
  'proveedor': 'pi-building',
  'ambos': 'pi-users'
};