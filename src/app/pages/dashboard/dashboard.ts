import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';

// PrimeNG Components
import { Card } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { DatePicker } from 'primeng/datepicker';
import { MultiSelect } from 'primeng/multiselect';
import { ProgressBar } from 'primeng/progressbar';
import { ChartModule } from 'primeng/chart';
import { Tag } from 'primeng/tag';
import { Badge } from 'primeng/badge';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Checkbox } from 'primeng/checkbox';
import { RadioButton } from 'primeng/radiobutton';
import { Textarea } from 'primeng/textarea';
import { Rating } from 'primeng/rating';
import { Slider } from 'primeng/slider';
import { ToggleButton } from 'primeng/togglebutton';
import { InputNumber } from 'primeng/inputnumber';

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: string;
  rating: number;
  date: Date;
}

interface ChartData {
  labels: string[];
  datasets: any[];
}

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    Card,
    TableModule,
    Button,
    InputText,
    Select,
    DatePicker,
    MultiSelect,
    ProgressBar,
    ChartModule,
    Tag,
    Badge,
    ToastModule,
    Checkbox,
    RadioButton,
    Textarea,
    Rating,
    Slider,
    ToggleButton,
    InputNumber
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  providers: [MessageService]
})
export class Dashboard implements OnInit {
  products: Product[] = [];
  chartData: ChartData = { labels: [], datasets: [] };
  chartOptions: any;
  
  // Form data
  sampleForm: FormGroup;
  categories = [
    { label: 'Electrónicos', value: 'electronics' },
    { label: 'Ropa', value: 'clothing' },
    { label: 'Hogar', value: 'home' },
    { label: 'Deportes', value: 'sports' }
  ];
  
  selectedCategories: any[] = [];
  selectedDate: Date = new Date();
  sliderValue: number = 50;
  rating: number = 4;
  toggleValue: boolean = false;
  checkboxValue: boolean = true;
  radioValue: string = 'option1';
  numberValue: number = 100;

  constructor(
    private fb: FormBuilder,
    private messageService: MessageService
  ) {
    this.sampleForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      category: ['', Validators.required],
      description: [''],
      date: [new Date(), Validators.required]
    });
  }

  ngOnInit(): void {
    this.initializeData();
    this.initializeChart();
  }

  initializeData(): void {
    this.products = [
      {
        id: 1,
        name: 'Laptop Dell Inspiron',
        category: 'Electrónicos',
        price: 850000,
        stock: 15,
        status: 'En Stock',
        rating: 4.5,
        date: new Date('2024-01-15')
      },
      {
        id: 2,
        name: 'Camiseta Nike',
        category: 'Ropa',
        price: 45000,
        stock: 0,
        status: 'Agotado',
        rating: 4.2,
        date: new Date('2024-02-10')
      },
      {
        id: 3,
        name: 'Mesa de Comedor',
        category: 'Hogar',
        price: 320000,
        stock: 8,
        status: 'En Stock',
        rating: 4.8,
        date: new Date('2024-01-28')
      },
      {
        id: 4,
        name: 'Balón de Fútbol',
        category: 'Deportes',
        price: 35000,
        stock: 25,
        status: 'En Stock',
        rating: 4.3,
        date: new Date('2024-02-05')
      },
      {
        id: 5,
        name: 'Smartphone Samsung',
        category: 'Electrónicos',
        price: 650000,
        stock: 3,
        status: 'Bajo Stock',
        rating: 4.6,
        date: new Date('2024-02-12')
      }
    ];
  }

  initializeChart(): void {
    this.chartData = {
      labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio'],
      datasets: [
        {
          label: 'Ventas',
          data: [65, 59, 80, 81, 56, 55],
          fill: false,
          borderColor: '#42A5F5',
          backgroundColor: 'rgba(66, 165, 245, 0.2)',
          tension: 0.4
        },
        {
          label: 'Compras',
          data: [28, 48, 40, 19, 86, 27],
          fill: false,
          borderColor: '#FFA726',
          backgroundColor: 'rgba(255, 167, 38, 0.2)',
          tension: 0.4
        }
      ]
    };

    this.chartOptions = {
      plugins: {
        legend: {
          labels: {
            usePointStyle: true,
            color: 'var(--text-color)'
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: 'var(--text-color-secondary)'
          },
          grid: {
            color: 'var(--surface-border)'
          }
        },
        y: {
          ticks: {
            color: 'var(--text-color-secondary)'
          },
          grid: {
            color: 'var(--surface-border)'
          }
        }
      }
    };
  }

  getSeverity(status: string): string {
    switch (status) {
      case 'En Stock':
        return 'success';
      case 'Bajo Stock':
        return 'warn';
      case 'Agotado':
        return 'danger';
      default:
        return 'info';
    }
  }

  showSuccess(): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Éxito',
      detail: 'Operación completada correctamente'
    });
  }

  showInfo(): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Información',
      detail: 'Este es un mensaje informativo'
    });
  }

  showWarn(): void {
    this.messageService.add({
      severity: 'warn',
      summary: 'Advertencia', 
      detail: 'Verifica los datos antes de continuar'
    });
  }

  showError(): void {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Ha ocurrido un error en la operación'
    });
  }

  onSubmit(): void {
    if (this.sampleForm.valid) {
      this.showSuccess();
    } else {
      this.showError();
    }
  }
}
