import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-calculator-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './calculator-layout.html',
  styleUrl: './calculator-layout.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalculatorLayoutComponent {
  title = input<string>('');
  subtitle = input<string>('');
  icon = input<string>('tune');
  currentToolName = input<string>('');
  showAdsense = input<boolean>(true);
}
