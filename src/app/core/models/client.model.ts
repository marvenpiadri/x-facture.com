export interface Client {
  id: string;
  slug: string;
  name: string;
  legalName?: string;
  email?: string;
  phone?: string;
  website?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  taxId?: string;
  electronicAddress?: string;
  electronicAddressScheme?: string;
  address?: string;
  defaultCurrency?: string;
  defaultTaxRate?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
