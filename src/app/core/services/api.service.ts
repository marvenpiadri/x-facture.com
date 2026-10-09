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
  items: {
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
  }[];
  totals: {
    subtotal: number;
    discount: number;
    taxable: number;
    tax: number;
    total: number;
    amountPaid: number;
    due: number;
  };
  vatBreakdown: { rate: number; taxable: number; tax: number }[];
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

export interface GeneratePdfOptions {
  htmlLayout: string;
  paperSize: 'a4' | 'letter';
  filename?: string;
}

export interface GenerateFacturXOptions {
  htmlLayout: string;
  rawInvoiceData: Record<string, unknown>;
  paperSize: 'a4' | 'letter';
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

  async validateEInvoice(payload: { xml?: string; pdfBase64?: string; profile?: string }): Promise<Record<string, unknown>> {
    return this.post<Record<string, unknown>>('/validate', payload);
  }

  async validateOrderX(xml: string): Promise<Record<string, unknown>> {
    return this.post<Record<string, unknown>>('/validate-order-x', { xml });
  }

  async extractFacturXXml(pdfBase64: string): Promise<{ success: boolean; filename?: string; profile?: string; xml: string }> {
    return this.post<{ success: boolean; filename?: string; profile?: string; xml: string }>('/extract', { pdfBase64 });
  }

  async extractFacturXAttachments(pdfBase64: string): Promise<{ success: boolean; attachments: { name: string; mimeType: string; size: number; dataBase64: string }[] }> {
    return this.post<{ success: boolean; attachments: { name: string; mimeType: string; size: number; dataBase64: string }[] }>('/extract-attachments', { pdfBase64 });
  }

  async embedXmlToPdf(payload: { pdfBase64: string; xml: string; profile?: string }): Promise<{ blob: Blob; filename: string }> {
    const response = await fetch(this.baseUrl + '/embed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/pdf' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw await this.toApiError(response);
    const blob = await response.blob();
    const disposition = response.headers.get('Content-Disposition') || '';
    const match = disposition.match(/filename="([^"]+)"/i);
    return { blob, filename: match?.[1] || 'factur-x.pdf' };
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

  async generatePdf(options: GeneratePdfOptions): Promise<{ blob: Blob; filename: string }> {
    const response = await fetch(`${this.baseUrl}/generate-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/pdf'
      },
      body: JSON.stringify({
        htmlLayout: options.htmlLayout,
        paperSize: options.paperSize
      })
    });

    if (!response.ok) throw await this.toApiError(response);

    const blob = await response.blob();
    const disposition = response.headers.get('Content-Disposition') || '';
    const match = disposition.match(/filename="([^"]+)"/i);

    return {
      blob,
      filename: match?.[1] || `${options.filename || 'document'}.pdf`
    };
  }

  async downloadPdf(
    document: BusinessDocument,
    htmlLayout: string,
    paperSize: 'a4' | 'letter' = document.paperSize === 'letter' ? 'letter' : 'a4'
  ): Promise<void> {
    const result = await this.generatePdf({
      htmlLayout,
      paperSize,
      filename: document.docNumber || 'document'
    });
    this.downloadBlob(result.blob, result.filename);
  }

  async generateFacturX(options: GenerateFacturXOptions): Promise<{ blob: Blob; filename: string }> {
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

  async downloadFacturX(
    document: BusinessDocument,
    htmlLayout: string,
    paperSize: 'a4' | 'letter' = document.paperSize === 'letter' ? 'letter' : 'a4'
  ): Promise<void> {
    const result = await this.generateFacturX({
      htmlLayout,
      paperSize,
      rawInvoiceData: this.toFacturXInvoice(document)
    });
    this.downloadBlob(result.blob, result.filename);
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = window.document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  private toFacturXInvoice(document: BusinessDocument): Record<string, unknown> {
    return {
      id: document.docNumber,
      invoiceNumber: document.docNumber,
      documentType: document.docType,
      date: document.issueDate,
      dueDate: document.dueDate || undefined,
      currency: document.currency || 'EUR',
      seller: {
        name: document.company.legalName || document.company.name,
        address: {
          line1: document.company.address,
          city: document.company.city,
          postalCode: document.company.postalCode,
          country: document.company.country
        },
        vatId: document.company.taxId,
        electronicAddress: document.company.electronicAddress,
        electronicAddressScheme: document.company.electronicAddressScheme,
        email: document.company.email,
        phone: document.company.phone,
        website: document.company.website
      },
      buyer: {
        name: document.client.legalName || document.client.name,
        address: {
          line1: document.client.address,
          city: document.client.city,
          postalCode: document.client.postalCode,
          country: document.client.country
        },
        vatId: document.client.taxId,
        electronicAddress: document.client.electronicAddress,
        electronicAddressScheme: document.client.electronicAddressScheme,
        email: document.client.email,
        phone: document.client.phone,
        website: document.client.website
      },
      items: document.items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitCost,
        vatRate: item.taxRate,
        discountPercent: item.discountPercent
      })),
      amountPaid: document.depositPaid,
      transactionNature: document.specialFields?.['transactionNature'],
      paymentMethod: document.specialFields?.['paymentMethod'],
      iban: document.specialFields?.['iban'],
      bic: document.specialFields?.['bic'],
      buyerReference: document.specialFields?.['buyerReference'],
      sellerSiren: document.specialFields?.['sellerSiren'],
      buyerSiren: document.specialFields?.['buyerSiren'],
      deliveryDate: document.specialFields?.['deliveryDate'],
      deliveryAddressLine1: document.specialFields?.['deliveryAddress'],
      deliveryCity: document.specialFields?.['deliveryCity'],
      deliveryPostalCode: document.specialFields?.['deliveryPostalCode'],
      deliveryCountry: document.specialFields?.['deliveryCountry']
    };
  }

  private async get<T>(path: string, query: Record<string, string> = {}): Promise<T> {
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
      const payload = await response.json() as {
        error?: {
          message?: string;
          code?: string;
          details?: { phase?: string };
        };
      };
      const phase = payload.error?.details?.phase;
      const message = payload.error?.message || `API request failed (HTTP ${response.status}).`;
      return new Error(phase ? `${message} [${phase}]` : message);
    } catch {
      return new Error(`API request failed (HTTP ${response.status}).`);
    }
  }
}
