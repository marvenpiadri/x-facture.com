export interface Client {
  id: string;
  slug: string;
  name: string;
  address?: string;
  defaultCurrency?: string;
  defaultTaxRate?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
