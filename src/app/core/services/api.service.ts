import { Injectable } from '@angular/core';
import { BusinessDocument } from '../models/document.model';

export interface ApiHealthResponse {
  success: boolean;
  service: string;
  status: string;
  version: string;
  timestamp: string;
}

export interface InvoiceCalculationResponse {
  success: boolean;
  currency: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    discountPercent: number;
    vatRate: number;
    subtotal: number;
    discount: number;
    taxable: number;
    tax: number;
    total: number;
  }>;
  totals: {
    subtotal: number;
    discount: number;
    taxable: number;
    tax: number;
    total: number;
    amountPaid: number;
    due: number;
  };
  vatBreakdown: Array<{ rate: number; taxable: number; tax: number }>;
  calculatedAt: string;
}

export interface CurrencyRatesResponse {
  success: boolean;
  base: string;
  rates: Record<string, number>;
  provider: string;
  updated?: string;
  nextUpdate?: string;
}

export interface GenerateFacturXOptions {
  htmlLayout: string;
  rawInvoiceData: Record<string, unknown>;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = 'https://api.x-facture.com/api';

  async health(): Promise<ApiHealthResponse> {
    return this.get<ApiHealthResponse>('/health');
  }

  async calculateInvoice(payload: Record<string, unknown>): Promise<InvoiceCalculationResponse> {
    return this.post<InvoiceCalculationResponse>('/invoice-calculate', payload);
  }

  async getCurrencyRates(base = 'EUR'): Promise<CurrencyRatesResponse> {
    return this.get<CurrencyRatesResponse>('/currency-rates', { base });
  }

  async generateQr(
    text: string,
    options: { format?: 'svg' | 'png'; margin?: number; ecLevel?: 'L' | 'M' | 'Q' | 'H' } = {}
  ): Promise<Blob> {
    const params = new URLSearchParams({ text });
    if (options.format) params.set('format', options.format);
    if (options.margin !== undefined) params.set('margin', String(options.margin));
    if (options.ecLevel) params.set('ecLevel', options.ecLevel);

    const response = await fetch(`${this.baseUrl}/generate-qr?${params.toString()}`, {
      headers: { Accept: options.format === 'png' ? 'image/png' : 'image/svg+xml' }
    });

    if (!response.ok) throw await this.toApiError(response);
    return response.blob();
  }

  async generateFacturX(
    options: GenerateFacturXOptions
  ): Promise<{ blob: Blob; filename: string }> {
    const response = await fetch(`${this.baseUrl}/generate-invoice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/pdf'
      },
      body: JSON.stringify(options)
    });

    if (!response.ok) throw await this.toApiError(response);

    const blob = await response.blob();
    const disposition = response.headers.get('Content-Disposition') || '';
    const match = disposition.match(/filename="([^"]+)"/i);

    return {
      blob,
      filename: match?.[1] || 'invoice-factur-x.pdf'
    };
  }

  async downloadFacturX(document: BusinessDocument, htmlLayout: string): Promise<void> {
    const result = await this.generateFacturX({
      htmlLayout,
      rawInvoiceData: this.toFacturXInvoice(document)
    });

    const url = URL.createObjectURL(result.blob);
    const anchor = window.document.createElement('a');
    anchor.href = url;
    anchor.download = result.filename;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  private toFacturXInvoice(document: BusinessDocument): Record<string, unknown> {
    return {
      id: document.docNumber,
      invoiceNumber: document.docNumber,
      date: document.issueDate,
      dueDate: document.dueDate || undefined,
      currency: document.currency || 'EUR',
      seller: {
        name: document.company.legalName || document.company.name,
        address: document.company.address,
        city: document.company.city,
        postalCode: document.company.postalCode,
        country: document.company.country,
        vatId: document.company.taxId
      },
      buyer: {
        name: document.client.legalName || document.client.name,
        address: document.client.address,
        city: document.client.city,
        postalCode: document.client.postalCode,
        country: document.client.country,
        vatId: document.client.taxId
      },
      items: document.items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitCost,
        vatRate: item.taxRate,
        discountPercent: item.discountPercent
      })),
      amountPaid: document.depositPaid
    };
  }

  private async get<T>(
    path: string,
    query: Record<string, string> = {}
  ): Promise<T> {
    const params = new URLSearchParams(query);
    const queryString = params.toString();
    const response = await fetch(
      `${this.baseUrl}${path}${queryString ? `?${queryString}` : ''}`,
      { headers: { Accept: 'application/json' } }
    );

    if (!response.ok) throw await this.toApiError(response);
    return response.json() as Promise<T>;
  }

  private async post<T>(path: string, body: Record<string, unknown>): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) throw await this.toApiError(response);
    return response.json() as Promise<T>;
  }

  private async toApiError(response: Response): Promise<Error> {
    try {
      const payload = await response.json() as { error?: { message?: string } };
      return new Error(payload.error?.message || `API request failed (HTTP ${response.status}).`);
    } catch {
      return new Error(`API request failed (HTTP ${response.status}).`);
    }
  }
}
