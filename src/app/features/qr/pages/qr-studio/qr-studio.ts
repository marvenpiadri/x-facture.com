import { ChangeDetectionStrategy, Component, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type QrMode = 'url' | 'text' | 'wifi' | 'email' | 'phone' | 'sms' | 'vcard' | 'location';

interface QrType {
  id: QrMode;
  label: string;
  icon: string;
  description: string;
}

@Component({
  selector: 'app-qr-studio',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './qr-studio.html',
  styleUrl: './qr-studio.css',
})
export class QrStudioPage {
  readonly types: QrType[] = [
    { id: 'url', label: 'Website', icon: 'link', description: 'Open a website or landing page' },
    { id: 'text', label: 'Text', icon: 'notes', description: 'Share any plain text' },
    { id: 'wifi', label: 'Wi-Fi', icon: 'wifi', description: 'Share a wireless network' },
    { id: 'email', label: 'Email', icon: 'mail', description: 'Create an email action' },
    { id: 'phone', label: 'Phone', icon: 'phone', description: 'Create a call action' },
    { id: 'sms', label: 'SMS', icon: 'sms', description: 'Create a prefilled message' },
    { id: 'vcard', label: 'Contact', icon: 'contact_page', description: 'Share contact details' },
    { id: 'location', label: 'Location', icon: 'location_on', description: 'Share a map location' },
  ];

  readonly activeType = signal<QrMode>('url');
  readonly value = signal('https://x-facture.com');
  readonly qrDataUrl = signal('');
  readonly foreground = signal('#111111');
  readonly background = signal('#ffffff');
  readonly size = signal(1024);
  readonly margin = signal(4);
  readonly errorCorrection = signal<'L' | 'M' | 'Q' | 'H'>('M');
  readonly isGenerating = signal(false);
  readonly error = signal<string | null>(null);

  readonly wifiSsid = signal('');
  readonly wifiPassword = signal('');
  readonly wifiSecurity = signal<'WPA' | 'WEP' | 'nopass'>('WPA');
  readonly emailAddress = signal('');
  readonly emailSubject = signal('');
  readonly emailBody = signal('');
  readonly phoneNumber = signal('');
  readonly smsNumber = signal('');
  readonly smsMessage = signal('');
  readonly contactName = signal('');
  readonly contactPhone = signal('');
  readonly contactEmail = signal('');
  readonly locationLat = signal('');
  readonly locationLng = signal('');

  constructor() {
    effect(() => {
      this.activeType();
      this.value();
      this.wifiSsid();
      this.wifiPassword();
      this.wifiSecurity();
      this.emailAddress();
      this.emailSubject();
      this.emailBody();
      this.phoneNumber();
      this.smsNumber();
      this.smsMessage();
      this.contactName();
      this.contactPhone();
      this.contactEmail();
      this.locationLat();
      this.locationLng();
      this.foreground();
      this.background();
      this.size();
      this.margin();
      this.errorCorrection();
      void this.generate();
    });
  }

  selectType(type: QrMode): void {
    this.activeType.set(type);
    this.error.set(null);
  }

  async generate(): Promise<void> {
    if (typeof window === 'undefined') return;

    const payload = this.buildPayload();
    if (!payload.trim()) {
      this.qrDataUrl.set('');
      return;
    }

    this.isGenerating.set(true);
    this.error.set(null);

    try {
      const module = await import('qrcode');
      const dataUrl = await module.toDataURL(payload, {
        width: this.size(),
        margin: this.margin(),
        errorCorrectionLevel: this.errorCorrection(),
        color: {
          dark: this.foreground(),
          light: this.background(),
        },
      });
      this.qrDataUrl.set(dataUrl);
    } catch (error) {
      console.error(error);
      this.error.set('The QR code could not be generated. Try a shorter value or simpler styling.');
    } finally {
      this.isGenerating.set(false);
    }
  }

  buildPayload(): string {
    switch (this.activeType()) {
      case 'url':
      case 'text':
        return this.value();
      case 'wifi':
        return `WIFI:T:${this.wifiSecurity()};S:${this.wifiSsid()};P:${this.wifiPassword()};;`;
      case 'email':
        return `mailto:${this.emailAddress()}?subject=${encodeURIComponent(this.emailSubject())}&body=${encodeURIComponent(this.emailBody())}`;
      case 'phone':
        return `tel:${this.phoneNumber()}`;
      case 'sms':
        return `SMSTO:${this.smsNumber()}:${this.smsMessage()}`;
      case 'vcard':
        return [
          'BEGIN:VCARD',
          'VERSION:3.0',
          `FN:${this.contactName()}`,
          `TEL:${this.contactPhone()}`,
          `EMAIL:${this.contactEmail()}`,
          'END:VCARD',
        ].join('\\n');
      case 'location':
        return `geo:${this.locationLat()},${this.locationLng()}`;
    }
  }

  download(format: 'png' | 'svg'): void {
    const dataUrl = this.qrDataUrl();
    if (!dataUrl) return;

    if (format === 'png') {
      this.triggerDownload(dataUrl, 'x-facture-qr.png');
      return;
    }

    const payload = this.buildPayload();
    import('qrcode').then(module =>
      module.toString(payload, {
        type: 'svg',
        margin: this.margin(),
        errorCorrectionLevel: this.errorCorrection(),
        color: { dark: this.foreground(), light: this.background() },
      })
    ).then(svg => {
      const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      this.triggerDownload(url, 'x-facture-qr.svg');
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
  }

  private triggerDownload(url: string, filename: string): void {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
  }

  get activeTypeConfig(): QrType {
    return this.types.find(type => type.id === this.activeType()) ?? this.types[0];
  }

  trackType(_: number, item: QrType): string {
    return item.id;
  }
}
