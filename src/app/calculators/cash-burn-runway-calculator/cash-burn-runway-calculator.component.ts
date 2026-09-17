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

@Component({
  selector: 'app-cash-burn-runway-calculator',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, CalculatorLayoutComponent, FintechCardComponent, FintechInputComponent],
  templateUrl: './cash-burn-runway-calculator.component.html',
  styleUrl: './cash-burn-runway-calculator.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CashBurnRunwayCalculatorComponent implements OnInit, AfterViewInit, OnDestroy {
  private titleService = inject(Title);
  private metaService = inject(Meta);
  private seoService = inject(SeoService);

  @ViewChild('calcChart') chartCanvas!: ElementRef<HTMLCanvasElement>;
  private chartInstance: Chart | null = null;

  ngOnInit(): void {
    this.seoService.updateMetadata({
      title: 'Cash Burn Rate & Runway Calculator | Startup Financial Projection Pro',
      description: 'Calculate startup gross burn, net monthly burn rate, revenue growth projections, and cash runway in months. Plan funding milestones and zero cash dates with rich charts.',
      keywords: 'cash burn calculator, startup runway calculator, net burn rate formula, zero cash date model, startup financial model'
    });

    this.seoService.setJsonLd({
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Cash Burn & Runway Calculator",
      "url": "https://ais-pre-7or4nnyzenrdo3iukkuhfv-534075635055.europe-west3.run.app/calculators/cash-burn-runway-calculator",
      "applicationCategory": "FinanceApplication",
      "operatingSystem": "All",
      "description": "Startup financial runway and burn rate forecasting tool.",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      }
    });
  }

  // Primary Inputs
  startingCash = signal<number>(150000);
  monthlyRevenue = signal<number>(22000);
  monthlyExpenses = signal<number>(38000);
  revenueGrowthRate = signal<number>(3); // % monthly MRR growth

  // Computations
  grossBurnRate = computed(() => {
    return Math.max(0, this.monthlyExpenses());
  });

  netBurnRate = computed(() => {
    return Math.max(0, this.monthlyExpenses() - this.monthlyRevenue());
  });

  isCashFlowPositive = computed(() => {
    return this.monthlyRevenue() >= this.monthlyExpenses();
  });

  zeroCashDate = computed(() => {
    const months = this.runwayMonths();
    if (months === Infinity) {
      return 'N/A (Cash Flow Positive)';
    }
    const date = new Date();
    date.setMonth(date.getMonth() + Math.floor(months));
    const dayFraction = months % 1;
    if (dayFraction > 0) {
      date.setDate(date.getDate() + Math.round(dayFraction * 30));
    }
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  });

  runwayMonths = computed(() => {
    const cash = Math.max(0, this.startingCash());
    const rev = Math.max(0, this.monthlyRevenue());
    const exp = Math.max(0, this.monthlyExpenses());
    const growth = this.revenueGrowthRate() / 100;

    if (rev >= exp) {
      return Infinity;
    }

    if (growth === 0) {
      const netBurn = exp - rev;
      return netBurn > 0 ? Math.round((cash / netBurn + Number.EPSILON) * 10) / 10 : Infinity;
    }

    // Dynamic month-by-month simulation
    let currentCash = cash;
    let currentRev = rev;
    let months = 0;

    while (currentCash > 0 && months < 120) {
      const netMonthlyBurn = exp - currentRev;
      if (netMonthlyBurn <= 0) {
        // Reached profitability before cash ran out
        return Infinity;
      }
      currentCash -= netMonthlyBurn;
      currentRev += currentRev * growth;
      months++;
    }

    return months;
  });

  // 12-Month Cash Projection Data for Line Chart
  projectionData = computed(() => {
    const cash = Math.max(0, this.startingCash());
    let currentRev = Math.max(0, this.monthlyRevenue());
    const exp = Math.max(0, this.monthlyExpenses());
    const growth = this.revenueGrowthRate() / 100;

    const labels: string[] = ['Current'];
    const cashPoints: number[] = [cash];
    const revenuePoints: number[] = [currentRev];
    const expensePoints: number[] = [exp];

    let runningCash = cash;

    for (let m = 1; m <= 12; m++) {
      labels.push(`M+${m}`);
      currentRev += currentRev * growth;
      runningCash = Math.max(0, runningCash - (exp - currentRev));

      cashPoints.push(Math.round(runningCash));
      revenuePoints.push(Math.round(currentRev));
      expensePoints.push(exp);
    }

    return { labels, cashPoints, revenuePoints, expensePoints };
  });

  constructor() {
    effect(() => {
      const proj = this.projectionData();
      this.updateChart(proj.labels, proj.cashPoints);
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

  setScenario(cash: number, rev: number, exp: number, growth = 0): void {
    this.startingCash.set(cash);
    this.monthlyRevenue.set(rev);
    this.monthlyExpenses.set(exp);
    this.revenueGrowthRate.set(growth);
  }

  private initChart(): void {
    if (!this.chartCanvas?.nativeElement) return;
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const proj = this.projectionData();

    this.chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: proj.labels,
        datasets: [
          {
            label: 'Projected Cash Reserve ($)',
            data: proj.cashPoints,
            borderColor: '#00e676',
            backgroundColor: 'rgba(0, 230, 118, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.35,
            pointBackgroundColor: '#00e676',
            pointBorderColor: '#0d1117',
            pointRadius: 4,
            pointHoverRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: { color: '#21262d' },
            ticks: { color: '#8b949e', font: { size: 11 } },
          },
          y: {
            grid: { color: '#21262d' },
            ticks: {
              color: '#8b949e',
              font: { size: 11 },
              callback: (val) => `$${Number(val).toLocaleString()}`,
            },
          },
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: { color: '#c9d1d9', font: { size: 12, weight: 'bold' } },
          },
          tooltip: {
            backgroundColor: '#161b22',
            titleColor: '#ffffff',
            bodyColor: '#c9d1d9',
            borderColor: '#30363d',
            borderWidth: 1,
            callbacks: {
              label: (context) => ` Cash Balance: $${Number(context.raw).toLocaleString()}`,
            },
          },
        },
      },
    });
  }

  private updateChart(labels: string[], cashPoints: number[]): void {
    if (!this.chartInstance) return;
    this.chartInstance.data.labels = labels;
    this.chartInstance.data.datasets[0].data = cashPoints;
    this.chartInstance.update();
  }
}
