import { ChangeDetectionStrategy, Component, ElementRef, HostListener, inject, input, output, signal } from '@angular/core';
import { CountryOption, CountryService } from '../../../core/services/country.service';

@Component({
  selector: 'app-country-picker',
  standalone: true,
  templateUrl: './country-picker.html',
  styleUrl: './country-picker.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CountryPickerComponent {
  private readonly countryService = inject(CountryService);
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  value = input<string>('');
  placeholder = input<string>('Select country…');
  ariaLabel = input<string>('Country');
  valueChange = output<string>();

  readonly query = signal('');
  readonly open = signal(false);
  readonly countries = this.countryService.countries;
  readonly results = signal<CountryOption[]>([]);

  constructor() {
    void this.countryService.load().then(() => this.refreshResults());
  }

  selectedCountry(): CountryOption | undefined {
    return this.countryService.findByCode(this.value());
  }

  openPicker(): void {
    this.open.set(true);
    this.query.set('');
    this.refreshResults();
  }

  closePicker(): void {
    this.open.set(false);
    this.query.set('');
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.query.set(value);
    this.results.set(this.countryService.search(value));
  }

  selectCountry(country: CountryOption): void {
    this.valueChange.emit(country.code);
    this.closePicker();
  }

  clearCountry(): void {
    this.valueChange.emit('');
    this.closePicker();
  }

  refreshResults(): void {
    this.results.set(this.countryService.search(this.query()));
  }

  @HostListener('document:mousedown', ['$event'])
  onDocumentMouseDown(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.closePicker();
    }
  }
}
