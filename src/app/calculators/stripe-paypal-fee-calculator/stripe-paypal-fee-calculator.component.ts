import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  signal,
  computed,
  effect,
  AfterViewInit,
  OnDestroy,
  OnInit,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { SeoService } from '../../core/services/seo.service';
import { Chart, registerables } from 'chart.js';
import { CalculatorLayoutComponent, FintechCardComponent, FintechInputComponent } from '../../shared/components';

Chart.register(...registerables);

interface FeeTier {
  id: string;
  name: string;
  percent: number;
  fixed: number;
  provider: 'Stripe' | 'PayPal' | 'Custom';
  description: string;
}

@Component({
  selector: 'app-stripe-paypal-fee-calculator',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, CalculatorLayoutComponent, FintechCardComponent, FintechInputComponent],
  templateUrl: './stripe-paypal-fee-calculator.component.html',
  styleUrl: './stripe-paypal-fee-calculator.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StripePaypalFeeCalculatorComponent implements OnInit, AfterViewInit, OnDestroy {
  private titleService = inject(Title);
  private metaService = inject(Meta);
  private seoService = inject(SeoService);

  @ViewChild('calcChart') chartCanvas!: ElementRef<HTMLCanvasElement>;
  private chartInstance: Chart | null = null;

  ngOnInit(): void {
    this.seoService.updateMetadata({
      title: 'Stripe & PayPal Fee Calculator (2026) | Merchant Fee & Surcharge Pro',
      description: 'Calculate exact Stripe and PayPal payment processing fees. Compute invoice fee pass-through surcharges to receive exact net payout amounts without losing margin.',
      keywords: 'stripe fee calculator, paypal fee calculator, credit card processing fee, invoice surcharge calculator, payment gateway fees, merchant fee optimizer'
    });

    this.seoService.setJsonLd({
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Stripe & PayPal Fee Calculator",
      "url": "https://ais-pre-7or4nnyzenrdo3iukkuhfv-534075635055.europe-west3.run.app/calculators/stripe-paypal-fee-calculator",
      "applicationCategory": "FinanceApplication",
      "operatingSystem": "All",
      "description": "Professional merchant processing fee calculator for Stripe, PayPal, and Square.",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      }
    });
  }

  // Preset Fee Profiles
  readonly feePresets: FeeTier[] = [
    { id: 'stripe-us', name: 'Stripe US Standard', percent: 2.9, fixed: 0.30, provider: 'Stripe', description: '2.9% + $0.30 (Domestic Cards)' },
    { id: 'stripe-intl', name: 'Stripe International', percent: 3.9, fixed: 0.30, provider: 'Stripe', description: '3.9% + $0.30 (Cross-border + FX)' },
    { id: 'stripe-ach', name: 'Stripe ACH Direct Debit', percent: 0.8, fixed: 0.00, provider: 'Stripe', description: '0.8% (Capped at $5.00)' },
    { id: 'paypal-us', name: 'PayPal Commerce US', percent: 3.49, fixed: 0.49, provider: 'PayPal', description: '3.49% + $0.49 (Standard Checkout)' },
    { id: 'paypal-qr', name: 'PayPal In-Person QR', percent: 1.9, fixed: 0.10, provider: 'PayPal', description: '1.90% + $0.10 (QR Transactions > $10)' },
    { id: 'paypal-intl', name: 'PayPal International', percent: 4.99, fixed: 0.49, provider: 'PayPal', description: '4.99% + $0.49 (Cross-border)' },
    { id: 'custom', name: 'Custom Gateway Rate', percent: 2.5, fixed: 0.25, provider: 'Custom', description: 'Custom negotiable processing fee' },
  ];

  // Calculation Direction Mode: 'from-gross' (I want to charge $X, what do I get?) vs 'to-net' (I need to receive $X, what do I charge?)
  calcMode = signal<'from-gross' | 'to-net'>('from-gross');
  
  // Active Tier
  selectedPresetId = signal<string>('stripe-us');
  
  // Custom or fine-tuned rates
  feePercent = signal<number>(2.9);
  feeFixed = signal<number>(0.30);
  
  // User Amount Input
  inputAmount = signal<number>(1000);

  // Computations
  activePreset = computed(() => {
    return this.feePresets.find(p => p.id === this.selectedPresetId()) ?? this.feePresets[0];
  });

  // When calculating from Gross Amount entered:
  // Fee = Amount * (Rate/100) + Fixed
  // Net = Amount - Fee
  fromGrossResults = computed(() => {
    const gross = Math.max(0, this.inputAmount());
    const pct = this.feePercent();
    const fixed = this.feeFixed();

    const percentageFee = (gross * pct) / 100;
    let totalFee = percentageFee + fixed;

    // Special cap handling for ACH
    if (this.selectedPresetId() === 'stripe-ach' && totalFee > 5.00) {
      totalFee = 5.00;
    }

    // Safety guard
    if (totalFee > gross) {
      totalFee = gross;
    }

    const net = Math.max(0, gross - totalFee);
    const effectiveRate = gross > 0 ? (totalFee / gross) * 100 : 0;

    return {
      gross,
      percentageFee,
      fixedFee: fixed,
      totalFee,
      netPayout: net,
      effectiveRate,
    };
  });

  // When calculating required Gross to achieve Target Net:
  // TargetNet = (Gross * (1 - Rate/100)) - Fixed
  // Gross = (TargetNet + Fixed) / (1 - Rate/100)
  toNetResults = computed(() => {
    const targetNet = Math.max(0, this.inputAmount());
    const pct = this.feePercent();
    const fixed = this.feeFixed();
    const rateDecimal = pct / 100;

    let requiredGross = 0;
    if (rateDecimal < 1) {
      requiredGross = (targetNet + fixed) / (1 - rateDecimal);
    } else {
      requiredGross = targetNet + fixed;
    }

    let totalFee = requiredGross - targetNet;
    if (this.selectedPresetId() === 'stripe-ach') {
      if ((requiredGross * 0.008) > 5.00) {
        requiredGross = targetNet + 5.00;
        totalFee = 5.00;
      }
    }

    const percentageFee = (requiredGross * pct) / 100;
    const effectiveRate = requiredGross > 0 ? (totalFee / requiredGross) * 100 : 0;

    return {
      requiredGross,
      targetNet,
      totalFee,
      percentageFee,
      fixedFee: fixed,
      effectiveRate,
    };
  });

  // Unified display metrics
  displayMetrics = computed(() => {
    if (this.calcMode() === 'from-gross') {
      const res = this.fromGrossResults();
      return {
        gross: res.gross,
        fee: res.totalFee,
        net: res.netPayout,
        effectiveRate: res.effectiveRate,
        labelMain: 'Net Payout Received',
        labelSub: 'Amount reaching your bank account',
      };
    } else {
      const res = this.toNetResults();
      return {
        gross: res.requiredGross,
        fee: res.totalFee,
        net: res.targetNet,
        effectiveRate: res.effectiveRate,
        labelMain: 'Required Invoice Total',
        labelSub: 'Amount to bill client to net target',
      };
    }
  });

  constructor() {
    // Reactive effect to update Chart.js when calculation outputs change
    effect(() => {
      const metrics = this.displayMetrics();
      this.updateChart(metrics.net, metrics.fee);
    });
  }

  ngAfterViewInit(): void {
    this.initChart();
  }

  ngOnDestroy(): void {
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }
  }

  onSelectPreset(presetId: string): void {
    this.selectedPresetId.set(presetId);
    const p = this.feePresets.find(item => item.id === presetId);
    if (p) {
      this.feePercent.set(p.percent);
      this.feeFixed.set(p.fixed);
    }
  }

  setAmountPreset(amount: number): void {
    this.inputAmount.set(amount);
  }

  private initChart(): void {
    if (!this.chartCanvas?.nativeElement) return;
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const metrics = this.displayMetrics();

    this.chartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Net Revenue Kept', 'Processor Fees'],
        datasets: [
          {
            data: [metrics.net, metrics.fee],
            backgroundColor: ['#00e676', '#f85149'],
            borderColor: ['#0d1117', '#0d1117'],
            borderWidth: 3,
            hoverOffset: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#c9d1d9',
              font: {
                family: 'system-ui, -apple-system, sans-serif',
                size: 12,
                weight: 'bold',
              },
              padding: 16,
              usePointStyle: true,
            },
          },
          tooltip: {
            backgroundColor: '#161b22',
            titleColor: '#ffffff',
            bodyColor: '#c9d1d9',
            borderColor: '#30363d',
            borderWidth: 1,
            padding: 10,
            callbacks: {
              label: (context) => {
                const val = Number(context.raw) || 0;
                return ` ${context.label}: $${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
              },
            },
          },
        },
      },
    });
  }

  private updateChart(net: number, fee: number): void {
    if (!this.chartInstance) return;
    this.chartInstance.data.datasets[0].data = [net, fee];
    this.chartInstance.update();
  }
}
