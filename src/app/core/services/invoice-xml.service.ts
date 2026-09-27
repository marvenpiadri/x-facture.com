import { Injectable } from '@angular/core';
import { BusinessDocument } from '../models/document.model';

@Injectable({ providedIn: 'root' })
export class InvoiceXmlService {
  downloadInvoiceXml(doc: BusinessDocument): void {
    if (doc.docType !== 'invoices') {
      throw new Error('XML export is currently available for tax invoices only.');
    }

    const xml = this.buildUblInvoice(doc);
    const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = window.document.createElement('a');
    anchor.href = url;
    anchor.download = (doc.docNumber || 'invoice') + '.xml';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  private buildUblInvoice(doc: BusinessDocument): string {
    const e = (value: unknown): string => this.escape(String(value ?? ''));
    const money = (value: number): string => Number(value || 0).toFixed(2);
    const country = (value?: string): string => (value || '').trim().toUpperCase();

    const lines = doc.items.map((item, index) => [
      '    <cac:InvoiceLine>',
      '      <cbc:ID>' + (index + 1) + '</cbc:ID>',
      '      <cbc:InvoicedQuantity unitCode="C62">' + money(item.quantity) + '</cbc:InvoicedQuantity>',
      '      <cbc:LineExtensionAmount currencyID="' + e(doc.currency) + '">' + money(item.amount) + '</cbc:LineExtensionAmount>',
      '      <cac:Item><cbc:Description>' + e(item.description) + '</cbc:Description><cbc:Name>' + e(item.description || 'Item') + '</cbc:Name>',
      '        <cac:ClassifiedTaxCategory><cbc:ID>S</cbc:ID><cbc:Percent>' + money(item.taxRate) + '</cbc:Percent><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:ClassifiedTaxCategory>',
      '      </cac:Item>',
      '      <cac:Price><cbc:PriceAmount currencyID="' + e(doc.currency) + '">' + money(item.unitCost) + '</cbc:PriceAmount></cac:Price>',
      '    </cac:InvoiceLine>'
    ].join('\n')).join('\n');

    return [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">',
      '  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>',
      '  <cbc:CustomizationID>urn:x-facture:invoice:ubl:2.1</cbc:CustomizationID>',
      '  <cbc:ID>' + e(doc.docNumber) + '</cbc:ID>',
      '  <cbc:IssueDate>' + e(doc.issueDate) + '</cbc:IssueDate>',
      doc.dueDate ? '  <cbc:DueDate>' + e(doc.dueDate) + '</cbc:DueDate>' : '',
      '  <cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>',
      '  <cbc:DocumentCurrencyCode>' + e(doc.currency) + '</cbc:DocumentCurrencyCode>',
      '  <cac:AccountingSupplierParty><cac:Party>',
      '    <cac:PartyName><cbc:Name>' + e(doc.company.legalName || doc.company.name) + '</cbc:Name></cac:PartyName>',
      '    <cac:PostalAddress><cbc:StreetName>' + e(doc.company.address) + '</cbc:StreetName><cbc:CityName>' + e(doc.company.city) + '</cbc:CityName><cbc:PostalZone>' + e(doc.company.postalCode) + '</cbc:PostalZone><cac:Country><cbc:IdentificationCode>' + e(country(doc.company.country)) + '</cbc:IdentificationCode></cac:Country></cac:PostalAddress>',
      doc.company.taxId ? '    <cac:PartyTaxScheme><cbc:CompanyID>' + e(doc.company.taxId) + '</cbc:CompanyID><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:PartyTaxScheme>' : '',
      '  </cac:Party></cac:AccountingSupplierParty>',
      '  <cac:AccountingCustomerParty><cac:Party>',
      '    <cac:PartyName><cbc:Name>' + e(doc.client.legalName || doc.client.name) + '</cbc:Name></cac:PartyName>',
      '    <cac:PostalAddress><cbc:StreetName>' + e(doc.client.address) + '</cbc:StreetName><cbc:CityName>' + e(doc.client.city) + '</cbc:CityName><cbc:PostalZone>' + e(doc.client.postalCode) + '</cbc:PostalZone><cac:Country><cbc:IdentificationCode>' + e(country(doc.client.country)) + '</cbc:IdentificationCode></cac:Country></cac:PostalAddress>',
      doc.client.taxId ? '    <cac:PartyTaxScheme><cbc:CompanyID>' + e(doc.client.taxId) + '</cbc:CompanyID><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:PartyTaxScheme>' : '',
      '  </cac:Party></cac:AccountingCustomerParty>',
      '  <cac:TaxTotal><cbc:TaxAmount currencyID="' + e(doc.currency) + '">' + money(doc.taxAmount) + '</cbc:TaxAmount></cac:TaxTotal>',
      '  <cac:LegalMonetaryTotal><cbc:LineExtensionAmount currencyID="' + e(doc.currency) + '">' + money(doc.subtotal) + '</cbc:LineExtensionAmount><cbc:TaxExclusiveAmount currencyID="' + e(doc.currency) + '">' + money(doc.subtotal - doc.discountAmount) + '</cbc:TaxExclusiveAmount><cbc:TaxInclusiveAmount currencyID="' + e(doc.currency) + '">' + money(doc.total) + '</cbc:TaxInclusiveAmount><cbc:PayableAmount currencyID="' + e(doc.currency) + '">' + money(doc.balanceDue) + '</cbc:PayableAmount></cac:LegalMonetaryTotal>',
      lines,
      '</Invoice>'
    ].filter(Boolean).join('\n');
  }

  private escape(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&apos;');
  }
}
