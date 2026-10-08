import { Injectable } from '@angular/core';
import { BusinessDocument, DocumentLineItem, DocumentParty } from '../models/document.model';

export type StructuredInvoiceFormat = 'ubl' | 'cii' | 'order-x';

@Injectable({ providedIn: 'root' })
export class StructuredInvoiceService {
  generateUblInvoice(doc: BusinessDocument): string {
    const currency = this.currency(doc.currency);
    const taxRate = Math.max(0, Number(doc.taxRate) || 0);
    const category = taxRate > 0 ? 'S' : 'Z';
    const lines = doc.items.filter(item => item.description.trim() || item.amount > 0);
    const effectiveLines = lines.length ? lines : [{
      id: '1', description: 'Invoice', quantity: 1, unitCost: doc.total,
      taxRate, discountPercent: 0, amount: doc.total
    } as DocumentLineItem];

    const lineXml = effectiveLines.map((item, i) => this.ublLine(item, i + 1, currency, taxRate, category)).join('\n');
    const typeCode = doc.docType === 'credit-notes' ? '381' : '380';

    return [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">',
      '<cbc:CustomizationID>urn:cen.eu:en16931:2017</cbc:CustomizationID>',
      '<cbc:ProfileID>urn:peppol:bis:billing</cbc:ProfileID>',
      '<cbc:ID>' + this.esc(doc.docNumber) + '</cbc:ID>',
      '<cbc:IssueDate>' + this.esc(doc.issueDate) + '</cbc:IssueDate>',
      doc.dueDate ? '<cbc:DueDate>' + this.esc(doc.dueDate) + '</cbc:DueDate>' : '',
      '<cbc:InvoiceTypeCode>' + typeCode + '</cbc:InvoiceTypeCode>',
      doc.notes ? '<cbc:Note>' + this.esc(doc.notes) + '</cbc:Note>' : '',
      '<cbc:DocumentCurrencyCode>' + currency + '</cbc:DocumentCurrencyCode>',
      doc.purchaseOrderRef ? '<cac:OrderReference><cbc:ID>' + this.esc(doc.purchaseOrderRef) + '</cbc:ID></cac:OrderReference>' : '',
      '<cac:AccountingSupplierParty>' + this.ublParty(doc.company) + '</cac:AccountingSupplierParty>',
      '<cac:AccountingCustomerParty>' + this.ublParty(doc.client) + '</cac:AccountingCustomerParty>',
      doc.terms ? '<cac:PaymentTerms><cbc:Note>' + this.esc(doc.terms) + '</cbc:Note></cac:PaymentTerms>' : '',
      '<cac:TaxTotal><cbc:TaxAmount currencyID="' + currency + '">' + this.money(doc.taxAmount) + '</cbc:TaxAmount>',
      '<cac:TaxSubtotal><cbc:TaxableAmount currencyID="' + currency + '">' + this.money(doc.subtotal - doc.discountAmount + doc.shippingAmount) + '</cbc:TaxableAmount>',
      '<cbc:TaxAmount currencyID="' + currency + '">' + this.money(doc.taxAmount) + '</cbc:TaxAmount>',
      '<cac:TaxCategory><cbc:ID>' + category + '</cbc:ID><cbc:Percent>' + this.number(taxRate) + '</cbc:Percent><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:TaxCategory>',
      '</cac:TaxSubtotal></cac:TaxTotal>',
      '<cac:LegalMonetaryTotal>',
      '<cbc:LineExtensionAmount currencyID="' + currency + '">' + this.money(doc.subtotal) + '</cbc:LineExtensionAmount>',
      doc.discountAmount > 0 ? '<cbc:AllowanceTotalAmount currencyID="' + currency + '">' + this.money(doc.discountAmount) + '</cbc:AllowanceTotalAmount>' : '',
      doc.shippingAmount > 0 ? '<cbc:ChargeTotalAmount currencyID="' + currency + '">' + this.money(doc.shippingAmount) + '</cbc:ChargeTotalAmount>' : '',
      '<cbc:TaxExclusiveAmount currencyID="' + currency + '">' + this.money(doc.subtotal - doc.discountAmount + doc.shippingAmount) + '</cbc:TaxExclusiveAmount>',
      '<cbc:TaxInclusiveAmount currencyID="' + currency + '">' + this.money(doc.total) + '</cbc:TaxInclusiveAmount>',
      '<cbc:PayableAmount currencyID="' + currency + '">' + this.money(doc.balanceDue) + '</cbc:PayableAmount>',
      '</cac:LegalMonetaryTotal>',
      lineXml,
      '</Invoice>'
    ].filter(Boolean).join('\n');
  }

  generateCiiInvoice(doc: BusinessDocument): string {
    const currency = this.currency(doc.currency);
    const taxRate = Math.max(0, Number(doc.taxRate) || 0);
    const lines = doc.items.filter(item => item.description.trim() || item.amount > 0);
    const effectiveLines = lines.length ? lines : [{
      id: '1', description: 'Invoice', quantity: 1, unitCost: doc.total,
      taxRate, discountPercent: 0, amount: doc.total
    } as DocumentLineItem];
    const lineXml = effectiveLines.map((item, i) => this.ciiLine(item, i + 1, taxRate)).join('\n');
    const typeCode = doc.docType === 'credit-notes' ? '381' : '380';

    return [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100" xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100" xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">',
      '<rsm:ExchangedDocumentContext><ram:GuidelineSpecifiedDocumentContextParameter><ram:ID>urn:cen.eu:en16931:2017</ram:ID></ram:GuidelineSpecifiedDocumentContextParameter></rsm:ExchangedDocumentContext>',
      '<rsm:ExchangedDocument><ram:ID>' + this.esc(doc.docNumber) + '</ram:ID><ram:TypeCode>' + typeCode + '</ram:TypeCode><ram:IssueDateTime><udt:DateTimeString format="102">' + this.dateCompact(doc.issueDate) + '</udt:DateTimeString></ram:IssueDateTime></rsm:ExchangedDocument>',
      '<rsm:SupplyChainTradeTransaction>',
      lineXml,
      '<ram:ApplicableHeaderTradeAgreement>' + this.ciiParty('SellerTradeParty', doc.company) + this.ciiParty('BuyerTradeParty', doc.client) + '</ram:ApplicableHeaderTradeAgreement>',
      '<ram:ApplicableHeaderTradeDelivery/>',
      '<ram:ApplicableHeaderTradeSettlement>',
      '<ram:InvoiceCurrencyCode>' + currency + '</ram:InvoiceCurrencyCode>',
      '<ram:ApplicableTradeTax><ram:CalculatedAmount>' + this.money(doc.taxAmount) + '</ram:CalculatedAmount><ram:TypeCode>VAT</ram:TypeCode><ram:BasisAmount>' + this.money(doc.subtotal - doc.discountAmount + doc.shippingAmount) + '</ram:BasisAmount><ram:CategoryCode>' + (taxRate > 0 ? 'S' : 'Z') + '</ram:CategoryCode><ram:RateApplicablePercent>' + this.number(taxRate) + '</ram:RateApplicablePercent></ram:ApplicableTradeTax>',
      doc.terms ? '<ram:SpecifiedTradePaymentTerms><ram:Description>' + this.esc(doc.terms) + '</ram:Description>' + (doc.dueDate ? '<ram:DueDateDateTime><udt:DateTimeString format="102">' + this.dateCompact(doc.dueDate) + '</udt:DateTimeString></ram:DueDateDateTime>' : '') + '</ram:SpecifiedTradePaymentTerms>' : '',
      '<ram:SpecifiedTradeSettlementHeaderMonetarySummation><ram:LineTotalAmount>' + this.money(doc.subtotal) + '</ram:LineTotalAmount><ram:AllowanceTotalAmount>' + this.money(doc.discountAmount) + '</ram:AllowanceTotalAmount><ram:ChargeTotalAmount>' + this.money(doc.shippingAmount) + '</ram:ChargeTotalAmount><ram:TaxBasisTotalAmount>' + this.money(doc.subtotal - doc.discountAmount + doc.shippingAmount) + '</ram:TaxBasisTotalAmount><ram:TaxTotalAmount currencyID="' + currency + '">' + this.money(doc.taxAmount) + '</ram:TaxTotalAmount><ram:GrandTotalAmount>' + this.money(doc.total) + '</ram:GrandTotalAmount><ram:DuePayableAmount>' + this.money(doc.balanceDue) + '</ram:DuePayableAmount></ram:SpecifiedTradeSettlementHeaderMonetarySummation>',
      '</ram:ApplicableHeaderTradeSettlement></rsm:SupplyChainTradeTransaction></rsm:CrossIndustryInvoice>'
    ].filter(Boolean).join('\n');
  }

  generateOrderX(doc: BusinessDocument): string {
    const currency = this.currency(doc.currency);
    const lines = doc.items.filter(item => item.description.trim() || item.amount > 0);
    const lineXml = lines.map((item, i) =>
      '<ram:IncludedSupplyChainTradeLineItem>' +
      '<ram:AssociatedDocumentLineDocument><ram:LineID>' + String(i + 1) + '</ram:LineID></ram:AssociatedDocumentLineDocument>' +
      '<ram:SpecifiedTradeProduct><ram:Name>' + this.esc(item.description || 'Item') + '</ram:Name></ram:SpecifiedTradeProduct>' +
      '<ram:SpecifiedLineTradeAgreement><ram:NetPriceProductTradePrice><ram:ChargeAmount>' + this.money(item.unitCost) + '</ram:ChargeAmount><ram:BasisQuantity unitCode="C62">1</ram:BasisQuantity></ram:NetPriceProductTradePrice></ram:SpecifiedLineTradeAgreement>' +
      '<ram:SpecifiedLineTradeDelivery><ram:RequestedQuantity unitCode="C62">' + this.number(item.quantity) + '</ram:RequestedQuantity></ram:SpecifiedLineTradeDelivery>' +
      '<ram:SpecifiedLineTradeSettlement><ram:SpecifiedTradeSettlementLineMonetarySummation><ram:LineTotalAmount>' + this.money(item.amount) + '</ram:LineTotalAmount></ram:SpecifiedTradeSettlementLineMonetarySummation></ram:SpecifiedLineTradeSettlement>' +
      '</ram:IncludedSupplyChainTradeLineItem>'
    ).join('');
    const party = (p: DocumentParty) =>
      '<ram:Name>' + this.esc(p.legalName || p.name || 'Unnamed party') + '</ram:Name>' +
      (p.address || p.city || p.postalCode || p.country
        ? '<ram:PostalTradeAddress>' +
          (p.postalCode ? '<ram:PostcodeCode>' + this.esc(p.postalCode) + '</ram:PostcodeCode>' : '') +
          (p.address ? '<ram:LineOne>' + this.esc(p.address) + '</ram:LineOne>' : '') +
          (p.city ? '<ram:CityName>' + this.esc(p.city) + '</ram:CityName>' : '') +
          (p.country ? '<ram:CountryID>' + this.esc(p.country.toUpperCase().slice(0, 2)) + '</ram:CountryID>' : '') +
          '</ram:PostalTradeAddress>' : '') +
      (p.electronicAddress ? '<ram:URIUniversalCommunication><ram:URIID' + (p.electronicAddressScheme ? ' schemeID="' + this.esc(p.electronicAddressScheme) + '"' : '') + '>' + this.esc(p.electronicAddress) + '</ram:URIID></ram:URIUniversalCommunication>' : '') +
      (p.taxId ? '<ram:SpecifiedTaxRegistration><ram:ID schemeID="VA">' + this.esc(p.taxId) + '</ram:ID></ram:SpecifiedTaxRegistration>' : '');
    return [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<rsm:SCRDMCCBDACIOMessageStructure xmlns:rsm="urn:un:unece:uncefact:data:SCRDMCCBDACIOMessageStructure:100" xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:128" xmlns:qdt="urn:un:unece:uncefact:data:standard:QualifiedDataType:128" xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:128">',
      '<rsm:ExchangedDocumentContext><ram:BusinessProcessSpecifiedDocumentContextParameter><ram:ID>A1</ram:ID></ram:BusinessProcessSpecifiedDocumentContextParameter><ram:GuidelineSpecifiedDocumentContextParameter><ram:ID>urn:order-x.eu:1p0:basic</ram:ID></ram:GuidelineSpecifiedDocumentContextParameter></rsm:ExchangedDocumentContext>',
      '<rsm:ExchangedDocument><ram:ID>' + this.esc(doc.docNumber) + '</ram:ID><ram:TypeCode>220</ram:TypeCode><ram:IssueDateTime><udt:DateTimeString format="102">' + this.dateCompact(doc.issueDate) + '</udt:DateTimeString></ram:IssueDateTime></rsm:ExchangedDocument>',
      '<rsm:SupplyChainTradeTransaction>' + lineXml,
      '<ram:ApplicableHeaderTradeAgreement><ram:SellerTradeParty>' + party(doc.company) + '</ram:SellerTradeParty><ram:BuyerTradeParty>' + party(doc.client) + '</ram:BuyerTradeParty></ram:ApplicableHeaderTradeAgreement>',
      '<ram:ApplicableHeaderTradeDelivery/>',
      '<ram:ApplicableHeaderTradeSettlement><ram:OrderCurrencyCode>' + currency + '</ram:OrderCurrencyCode><ram:SpecifiedTradeSettlementHeaderMonetarySummation><ram:LineTotalAmount>' + this.money(doc.subtotal) + '</ram:LineTotalAmount><ram:TaxBasisTotalAmount>' + this.money(doc.subtotal) + '</ram:TaxBasisTotalAmount></ram:SpecifiedTradeSettlementHeaderMonetarySummation></ram:ApplicableHeaderTradeSettlement>',
      '</rsm:SupplyChainTradeTransaction></rsm:SCRDMCCBDACIOMessageStructure>'
    ].join('');
  }
  download(doc: BusinessDocument, format: StructuredInvoiceFormat): void {
    const xml = format === 'ubl' ? this.generateUblInvoice(doc) : format === 'order-x' ? this.generateOrderX(doc) : this.generateCiiInvoice(doc);
    const suffix = format === 'ubl' ? 'ubl.xml' : format === 'order-x' ? 'order-x.xml' : 'cii.xml';
    const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = window.document.createElement('a');
    anchor.href = url;
    anchor.download = (doc.docNumber || 'invoice') + '.' + suffix;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  private ublLine(item: DocumentLineItem, index: number, currency: string, taxRate: number, category: string): string {
    const rate = Number(item.taxRate) || taxRate;
    return '<cac:InvoiceLine><cbc:ID>' + index + '</cbc:ID><cbc:InvoicedQuantity unitCode="C62">' + this.number(item.quantity) + '</cbc:InvoicedQuantity><cbc:LineExtensionAmount currencyID="' + currency + '">' + this.money(item.amount) + '</cbc:LineExtensionAmount><cac:Item><cbc:Name>' + this.esc(item.description || 'Item') + '</cbc:Name><cac:ClassifiedTaxCategory><cbc:ID>' + category + '</cbc:ID><cbc:Percent>' + this.number(rate) + '</cbc:Percent><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:ClassifiedTaxCategory></cac:Item><cac:Price><cbc:PriceAmount currencyID="' + currency + '">' + this.money(item.unitCost) + '</cbc:PriceAmount></cac:Price></cac:InvoiceLine>';
  }

  private ublParty(party: DocumentParty): string {
    const name = party.legalName || party.name || 'Unnamed party';
    return '<cac:Party><cac:PartyName><cbc:Name>' + this.esc(name) + '</cbc:Name></cac:PartyName>' +
      (party.taxId ? '<cac:PartyTaxScheme><cbc:CompanyID>' + this.esc(party.taxId) + '</cbc:CompanyID><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:PartyTaxScheme>' : '') +
      '<cac:PostalAddress>' +
      (party.address ? '<cbc:StreetName>' + this.esc(party.address) + '</cbc:StreetName>' : '') +
      (party.city ? '<cbc:CityName>' + this.esc(party.city) + '</cbc:CityName>' : '') +
      (party.postalCode ? '<cbc:PostalZone>' + this.esc(party.postalCode) + '</cbc:PostalZone>' : '') +
      (party.country ? '<cac:Country><cbc:IdentificationCode>' + this.esc(party.country.toUpperCase().slice(0, 2)) + '</cbc:IdentificationCode></cac:Country>' : '') +
      '</cac:PostalAddress>' +
      (party.electronicAddress ? '<cbc:EndpointID' + (party.electronicAddressScheme ? ' schemeID="' + this.esc(party.electronicAddressScheme) + '"' : '') + '>' + this.esc(party.electronicAddress) + '</cbc:EndpointID>' : '') +
      (party.email ? '<cac:Contact><cbc:ElectronicMail>' + this.esc(party.email) + '</cbc:ElectronicMail></cac:Contact>' : '') +
      '</cac:Party>';
  }

  private ciiLine(item: DocumentLineItem, index: number, fallbackTaxRate: number): string {
    const rate = Number(item.taxRate) || fallbackTaxRate;
    return '<ram:IncludedSupplyChainTradeLineItem>' +
      '<ram:AssociatedDocumentLineDocument><ram:LineID>' + index + '</ram:LineID></ram:AssociatedDocumentLineDocument>' +
      '<ram:SpecifiedTradeProduct><ram:Name>' + this.esc(item.description || 'Item') + '</ram:Name></ram:SpecifiedTradeProduct>' +
      '<ram:SpecifiedLineTradeAgreement><ram:NetPriceProductTradePrice><ram:ChargeAmount>' + this.money(item.unitCost) + '</ram:ChargeAmount></ram:NetPriceProductTradePrice></ram:SpecifiedLineTradeAgreement>' +
      '<ram:SpecifiedLineTradeDelivery><ram:BilledQuantity unitCode="C62">' + this.number(item.quantity) + '</ram:BilledQuantity></ram:SpecifiedLineTradeDelivery>' +
      '<ram:SpecifiedLineTradeSettlement><ram:ApplicableTradeTax><ram:TypeCode>VAT</ram:TypeCode><ram:CategoryCode>' + (rate > 0 ? 'S' : 'Z') + '</ram:CategoryCode><ram:RateApplicablePercent>' + this.number(rate) + '</ram:RateApplicablePercent></ram:ApplicableTradeTax><ram:SpecifiedTradeSettlementLineMonetarySummation><ram:LineTotalAmount>' + this.money(item.amount) + '</ram:LineTotalAmount></ram:SpecifiedTradeSettlementLineMonetarySummation></ram:SpecifiedLineTradeSettlement>' +
      '</ram:IncludedSupplyChainTradeLineItem>';
  }

  private ciiParty(tag: string, party: DocumentParty): string {
    const name = party.legalName || party.name || 'Unnamed party';
    return '<ram:' + tag + '><ram:Name>' + this.esc(name) + '</ram:Name>' +
      (party.taxId ? '<ram:SpecifiedTaxRegistration><ram:ID schemeID="VA">' + this.esc(party.taxId) + '</ram:ID></ram:SpecifiedTaxRegistration>' : '') +
      (party.address || party.city || party.postalCode || party.country ? '<ram:PostalTradeAddress>' +
        (party.address ? '<ram:LineOne>' + this.esc(party.address) + '</ram:LineOne>' : '') +
        (party.postalCode ? '<ram:PostcodeCode>' + this.esc(party.postalCode) + '</ram:PostcodeCode>' : '') +
        (party.city ? '<ram:CityName>' + this.esc(party.city) + '</ram:CityName>' : '') +
        (party.country ? '<ram:CountryID>' + this.esc(party.country.toUpperCase().slice(0, 2)) + '</ram:CountryID>' : '') +
        '</ram:PostalTradeAddress>' : '') +
      (party.electronicAddress ? '<ram:URIUniversalCommunication><ram:URIID' + (party.electronicAddressScheme ? ' schemeID="' + this.esc(party.electronicAddressScheme) + '"' : '') + '>' + this.esc(party.electronicAddress) + '</ram:URIID></ram:URIUniversalCommunication>' : '') +
      (party.email ? '<ram:URIUniversalCommunication><ram:URIID>' + this.esc(party.email) + '</ram:URIID></ram:URIUniversalCommunication>' : '') +
      '</ram:' + tag + '>';
  }

  private esc(value: string): string {
    return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
  }

  private money(value: number): string {
    return (Number(value) || 0).toFixed(2);
  }

  private number(value: number): string {
    return (Number(value) || 0).toFixed(2).replace(/\.00$/, '');
  }

  private currency(value: string): string {
    const normalized = String(value || 'EUR').trim().toUpperCase();
    return /^[A-Z]{3}$/.test(normalized) ? normalized : 'EUR';
  }

  private dateCompact(value: string): string {
    return String(value || '').replace(/-/g, '').slice(0, 8);
  }
}
