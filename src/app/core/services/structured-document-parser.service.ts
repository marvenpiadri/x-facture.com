import { Injectable } from '@angular/core';
import { BusinessDocument, DocumentLineItem, DocumentParty } from '../models/document.model';

@Injectable({ providedIn: 'root' })
export class StructuredDocumentParserService {
  parse(xml: string, targetDocType: 'invoices' | 'credit-notes' = 'invoices'): BusinessDocument {
    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    const parseError = doc.querySelector('parsererror');
    if (parseError) throw new Error('The XML is not well formed.');

    const root = doc.documentElement;
    const local = (node: Element | null | undefined, name: string): Element | null =>
      node ? Array.from(node.getElementsByTagName('*')).find(e => e.localName === name) || null : null;
    const all = (node: Element | null | undefined, name: string): Element[] =>
      node ? Array.from(node.getElementsByTagName('*')).filter(e => e.localName === name) : [];
    const value = (node: Element | null | undefined, name: string): string => local(node, name)?.textContent?.trim() || '';

    const isCii = root.localName === 'CrossIndustryInvoice';
    const number = isCii
      ? value(local(root, 'ExchangedDocument'), 'ID')
      : value(root, 'ID');
    const issue = isCii
      ? this.dateValue(local(root, 'ExchangedDocument'))
      : value(root, 'IssueDate');
    const currency = isCii
      ? value(local(root, 'ApplicableHeaderTradeSettlement'), 'InvoiceCurrencyCode') || 'EUR'
      : value(root, 'DocumentCurrencyCode') || 'EUR';

    const parties = isCii
      ? this.ciiParties(root, local)
      : this.ublParties(root, local);

    const lineNodes = isCii
      ? all(root, 'IncludedSupplyChainTradeLineItem')
      : all(root, root.localName === 'CreditNote' ? 'CreditNoteLine' : 'InvoiceLine');

    const items: DocumentLineItem[] = lineNodes.map((line, index) => {
      const quantity = Number(value(line, isCii ? 'BilledQuantity' : 'InvoicedQuantity')) || 1;
      const unitCost = Number(value(line, isCii ? 'ChargeAmount' : 'PriceAmount')) || 0;
      const amount = Number(value(line, 'LineTotalAmount')) || Math.max(0, quantity * unitCost);
      const taxRate = Number(value(line, 'RateApplicablePercent') || value(line, 'Percent')) || 0;
      return {
        id: String(index + 1),
        description: value(line, isCii ? 'Name' : 'Name') || 'Item',
        quantity,
        unitCost,
        taxRate,
        discountPercent: 0,
        amount
      };
    });

    const totalsNode = isCii ? local(root, 'SpecifiedTradeSettlementHeaderMonetarySummation') : local(root, 'LegalMonetaryTotal');
    const subtotal = Number(value(totalsNode, isCii ? 'LineTotalAmount' : 'LineExtensionAmount')) || items.reduce((n, i) => n + i.amount, 0);
    const taxAmount = Number(value(root, isCii ? 'TaxTotalAmount' : 'TaxAmount')) || 0;
    const total = Number(value(totalsNode, isCii ? 'GrandTotalAmount' : 'TaxInclusiveAmount')) || subtotal + taxAmount;
    const due = Number(value(totalsNode, isCii ? 'DuePayableAmount' : 'PayableAmount')) || total;

    const now = new Date().toISOString();
    return {
      id: `imported-${Date.now()}`,
      docNumber: number || `IMP-${Date.now()}`,
      slug: (number || `IMP-${Date.now()}`).toLowerCase(),
      docType: targetDocType,
      docTypeLabel: targetDocType === 'credit-notes' ? 'Credit Note / Memo' : 'Tax Invoice',
      status: 'draft',
      currency,
      issueDate: issue || new Date().toISOString().slice(0, 10),
      dueDate: this.dateValue(root),
      purchaseOrderRef: '',
      company: parties.seller,
      client: parties.buyer,
      lineLayoutMode: 'quantity',
      templateId: 'modern',
      paperSize: 'a4',
      hasPricing: true,
      items: items.length ? items : [{ id: '1', description: 'Imported invoice', quantity: 1, unitCost: total, taxRate: 0, discountPercent: 0, amount: total }],
      subtotal,
      taxRate: items[0]?.taxRate || 0,
      taxAmount,
      discountAmount: 0,
      shippingAmount: 0,
      total,
      depositPaid: Math.max(0, total - due),
      balanceDue: due,
      notes: '',
      terms: '',
      bankDetails: '',
      specialFields: { importedXml: true, sourceSyntax: isCii ? 'CII' : 'UBL' },
      createdAt: now,
      updatedAt: now
    };
  }

  private ciiParties(root: Element, local: (node: Element | null | undefined, name: string) => Element | null): { seller: DocumentParty; buyer: DocumentParty } {
    const sellerNode = local(root, 'SellerTradeParty');
    const buyerNode = local(root, 'BuyerTradeParty');
    return { seller: this.ciiParty(sellerNode, local), buyer: this.ciiParty(buyerNode, local) };
  }

  private ciiParty(node: Element | null, local: (node: Element | null | undefined, name: string) => Element | null): DocumentParty {
    const uri = local(node, 'URIID');
    return {
      name: node ? local(node, 'Name')?.textContent?.trim() || '' : '',
      legalName: node ? local(node, 'TradingBusinessName')?.textContent?.trim() || '' : '',
      address: node ? local(node, 'LineOne')?.textContent?.trim() || '' : '',
      city: node ? local(node, 'CityName')?.textContent?.trim() || '' : '',
      postalCode: node ? local(node, 'PostcodeCode')?.textContent?.trim() || '' : '',
      country: node ? local(node, 'CountryID')?.textContent?.trim() || '' : '',
      taxId: node ? local(node, 'SpecifiedTaxRegistration')?.textContent?.trim() || '' : '',
      email: node ? local(node, 'ElectronicMail')?.textContent?.trim() || '' : '',
      electronicAddress: uri?.textContent?.trim() || '',
      electronicAddressScheme: uri?.getAttribute('schemeID') || ''
    };
  }

  private ublParties(root: Element, local: (node: Element | null | undefined, name: string) => Element | null): { seller: DocumentParty; buyer: DocumentParty } {
    const supplier = local(root, 'AccountingSupplierParty');
    const customer = local(root, 'AccountingCustomerParty');
    return { seller: this.ublParty(supplier, local), buyer: this.ublParty(customer, local) };
  }

  private ublParty(node: Element | null, local: (node: Element | null | undefined, name: string) => Element | null): DocumentParty {
    const endpoint = local(node, 'EndpointID');
    const email = local(node, 'ElectronicMail');
    return {
      name: node ? local(node, 'Name')?.textContent?.trim() || '' : '',
      legalName: node ? local(node, 'RegistrationName')?.textContent?.trim() || '' : '',
      address: node ? local(node, 'StreetName')?.textContent?.trim() || '' : '',
      city: node ? local(node, 'CityName')?.textContent?.trim() || '' : '',
      postalCode: node ? local(node, 'PostalZone')?.textContent?.trim() || '' : '',
      country: node ? local(node, 'IdentificationCode')?.textContent?.trim() || '' : '',
      taxId: node ? local(node, 'CompanyID')?.textContent?.trim() || '' : '',
      email: email?.textContent?.trim() || '',
      electronicAddress: endpoint?.textContent?.trim() || '',
      electronicAddressScheme: endpoint?.getAttribute('schemeID') || ''
    };
  }

  private dateValue(node: Element | null): string {
    if (!node) return '';
    const direct = node.textContent?.trim() || '';
    const compact = direct.match(/(\d{4})[-/]?(\d{2})[-/]?(\d{2})/);
    return compact ? `${compact[1]}-${compact[2]}-${compact[3]}` : '';
  }
}
