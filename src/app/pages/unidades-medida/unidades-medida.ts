import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';

// PrimeNG Components
import { Card } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Dialog } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { Badge } from 'primeng/badge';
import { Tag } from 'primeng/tag';
import { ProgressSpinner } from 'primeng/progressspinner';
import { Toolbar } from 'primeng/toolbar';
import { InputIcon } from 'primeng/inputicon';
import { IconField } from 'primeng/iconfield';
import { Tooltip } from 'primeng/tooltip';

// Services and Interfaces
import { UnidadesMedidaService } from '../../services/unidades-medida.service';
import { MessageService, ConfirmationService } from 'primeng/api';
import { 
  UnidadMedida, 
  UnidadesMedidaResponse, 
  CreateUnidadMedidaDto, 
  UpdateUnidadMedidaDto,
  UnidadPredefinida,
  VistaUnidades,
  ModoFormulario 
} from '../../interfaces/unidad-medida.interface';

@Component({
  selector: 'app-unidades-medida',
  imports: [

  ],
  templateUrl: './unidades-medida.html',
  styleUrl: './unidades-medida.scss',
  providers: []
})
export class UnidadesMedida {
 
}