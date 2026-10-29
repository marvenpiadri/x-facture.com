import { BusinessDocument, DocumentLineItem } from '../models/document.model';
import { DocumentTypeConfig } from '../models/document-type-config.model';
import { CalculationService } from '../services/calculation.service';

export const FORMAL_TEMPLATES = [
  { id: 'modern', label: 'Modern' },
  { id: 'classic', label: 'Minimal' },
  { id: 'bold', label: 'Bold' }
] as const;

const calc = new CalculationService();

const line = (id: string, description: string, quantity: number, unitCost: number): DocumentLineItem => ({
  id, description, quantity, unitCost, taxRate: 20, discountPercent: 0,
  amount: calc.calculateLineAmount(unitCost, quantity, 0)
});

/** Fictional document used only to show what a design looks like (landing page, template picker). */
export function sampleDocument(config: DocumentTypeConfig, templateId: string): BusinessDocument {
  const items = [
    line('s1', 'Brand identity design', 1, 1800),
    line('s2', 'Website build (10 pages)', 1, 3200),
    line('s3', 'Monthly maintenance', 3, 150)
  ];
  const totals = calc.calculateDocumentTotals(items, 0, 0);
  return {
    id: `sample-${config.docType}`,
    docNumber: `${config.defaultPrefix}-2026-0042`,
    slug: 'sample',
    docType: config.docType,
    docTypeLabel: config.singularName,
    status: 'draft',
    currency: 'EUR',
    issueDate: '2026-10-28',
    dueDate: '2026-11-27',
    company: { name: 'Atelier Nova', email: 'hello@ateliernova.example', address: '12 Rue des Lilas', city: 'Lyon', postalCode: '69002', country: 'FR', taxId: 'FR12345678901' },
    client: { name: 'Maison Dupont SARL', email: 'compta@dupont.example', address: '8 Avenue Victor Hugo', city: 'Paris', postalCode: '75016', country: 'FR' },
    lineLayoutMode: config.defaultLineLayoutMode,
    templateId,
    paperSize: 'a4',
    hasPricing: config.hasPricing,
    items,
    subtotal: totals.subtotal,
    taxRate: 0,
    taxAmount: totals.taxAmount,
    discountAmount: 0,
    shippingAmount: 0,
    total: totals.total,
    depositPaid: 0,
    balanceDue: totals.total,
    notes: 'Thank you for your business.',
    createdAt: '2026-10-28T09:00:00.000Z',
    updatedAt: '2026-10-28T09:00:00.000Z'
  };
}
