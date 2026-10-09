/**
 * Country-aware party identifier suggestions.
 * This registry is extensible UI guidance, not legal advice or proof of registration.
 * Tax registration, ISO 6523 legal-entity identifiers, and electronic-address schemes are distinct.
 */
import { PartyTaxIdentifier } from '../models/document.model';

export interface PartyIdentifierDefinition {
  type: string;
  label: string;
  category: 'tax' | 'vat' | 'business' | 'social' | 'other';
  schemeId?: string;
}
const definitions: Record<string, PartyIdentifierDefinition[]> = {
  MA: [
    { type: 'ICE', label: 'ICE (Common Enterprise Identifier)', category: 'business' },
    { type: 'IF', label: 'IF (Fiscal Identifier)', category: 'tax' },
    { type: 'RC', label: 'RC (Registre du commerce)', category: 'business' },
    { type: 'PATENTE', label: 'Patente / Taxe professionnelle (TP)', category: 'tax' },
    { type: 'CNSS', label: 'CNSS (Social Security Registration)', category: 'social' },
    { type: 'VAT', label: 'TVA registration', category: 'vat' }
  ],
  FR: [
    { type: 'VAT', label: 'VAT number (TVA intracommunautaire)', category: 'vat' },
    { type: 'SIREN', label: 'SIREN (French business identifier)', category: 'business', schemeId: '0002' },
    { type: 'SIRET', label: 'SIRET (Establishment registration)', category: 'business', schemeId: '0009' },
    { type: 'RCS', label: 'RCS (Registre du commerce et des sociétés)', category: 'business' }
  ],
  DE: [
    { type: 'VAT', label: 'VAT ID (USt-IdNr.)', category: 'vat' },
    { type: 'TAX_ID', label: 'Tax number (Steuernummer)', category: 'tax' },
    { type: 'W_ID', label: 'Economic Identification Number (W-IdNr.)', category: 'business' },
    { type: 'HRB', label: 'Commercial Register (HRB / HRA)', category: 'business' }
  ],
  GB: [
    { type: 'VAT', label: 'VAT registration number', category: 'vat' },
    { type: 'CRN', label: 'Companies House registration number', category: 'business' },
    { type: 'UTR', label: 'Unique Taxpayer Reference (UTR)', category: 'tax' }
  ],
  US: [
    { type: 'EIN', label: 'Employer Identification Number (EIN)', category: 'tax' },
    { type: 'TIN', label: 'Taxpayer Identification Number (TIN)', category: 'tax' },
    { type: 'STATE_REG', label: 'State business registration number', category: 'business' },
    { type: 'SALES_TAX', label: 'State sales tax registration', category: 'vat' }
  ],
  CA: [
    { type: 'BN', label: 'Business Number (BN)', category: 'tax' },
    { type: 'GST_HST', label: 'GST/HST account number', category: 'vat' },
    { type: 'QST', label: 'QST registration number', category: 'vat' },
    { type: 'CORP', label: 'Corporation number', category: 'business' }
  ],
  ES: [
    { type: 'VAT', label: 'VAT number (NIF-IVA)', category: 'vat' },
    { type: 'NIF', label: 'NIF (Tax Identification Number)', category: 'tax' },
    { type: 'REG_MERCANTIL', label: 'Commercial Register', category: 'business' }
  ],
  IT: [
    { type: 'VAT', label: 'VAT number (Partita IVA)', category: 'vat' },
    { type: 'CODICE_FISCALE', label: 'Codice Fiscale', category: 'tax' },
    { type: 'REA', label: 'REA registration number', category: 'business' }
  ],
  BE: [
    { type: 'VAT', label: 'VAT number', category: 'vat' },
    { type: 'CBE', label: 'Enterprise number (CBE/KBO)', category: 'business', schemeId: '0208' }
  ],
  NL: [
    { type: 'VAT', label: 'VAT identification number (btw-id)', category: 'vat' },
    { type: 'RSIN', label: 'RSIN', category: 'tax' },
    { type: 'KVK', label: 'Chamber of Commerce number (KvK)', category: 'business', schemeId: '0106' }
  ],
  PT: [
    { type: 'VAT', label: 'VAT number (NIF/NIPC)', category: 'vat' },
    { type: 'CRC', label: 'Commercial Registry number', category: 'business' }
  ],
  IE: [
    { type: 'VAT', label: 'VAT number', category: 'vat' },
    { type: 'CRO', label: 'Companies Registration Office number', category: 'business' },
    { type: 'TAX_REF', label: 'Tax reference number', category: 'tax' }
  ],
  PL: [
    { type: 'VAT', label: 'VAT number (NIP-UE)', category: 'vat' },
    { type: 'NIP', label: 'Tax identification number (NIP)', category: 'tax' },
    { type: 'REGON', label: 'REGON statistical number', category: 'business' },
    { type: 'KRS', label: 'National Court Register (KRS)', category: 'business' }
  ],
  AT: [
    { type: 'VAT', label: 'VAT number (UID)', category: 'vat' },
    { type: 'FN', label: 'Company Register number (Firmenbuchnummer)', category: 'business' },
    { type: 'TAX_ID', label: 'Tax number', category: 'tax' }
  ],
  CH: [
    { type: 'VAT', label: 'VAT number (MWST/TVA/IVA)', category: 'vat' },
    { type: 'UID', label: 'Business Identification Number (UID)', category: 'business' },
    { type: 'HR', label: 'Commercial Register number', category: 'business' }
  ],
  AU: [
    { type: 'ABN', label: 'Australian Business Number (ABN)', category: 'business' },
    { type: 'ACN', label: 'Australian Company Number (ACN)', category: 'business' },
    { type: 'GST', label: 'GST registration', category: 'vat' },
    { type: 'TFN', label: 'Tax File Number (TFN)', category: 'tax' }
  ],
  NZ: [
    { type: 'NZBN', label: 'New Zealand Business Number', category: 'business' },
    { type: 'GST', label: 'GST number', category: 'vat' },
    { type: 'IRD', label: 'IRD number', category: 'tax' }
  ],
  IN: [
    { type: 'GSTIN', label: 'GST Identification Number (GSTIN)', category: 'vat' },
    { type: 'PAN', label: 'Permanent Account Number (PAN)', category: 'tax' },
    { type: 'CIN', label: 'Corporate Identification Number (CIN)', category: 'business' },
    { type: 'TAN', label: 'Tax Deduction and Collection Account Number (TAN)', category: 'tax' }
  ],
  BR: [
    { type: 'CNPJ', label: 'CNPJ (Company Taxpayer Registry)', category: 'tax' },
    { type: 'CPF', label: 'CPF (Individual Taxpayer Registry)', category: 'tax' },
    { type: 'IE', label: 'State Tax Registration (Inscrição Estadual)', category: 'vat' },
    { type: 'IM', label: 'Municipal Registration (Inscrição Municipal)', category: 'business' }
  ],
  MX: [
    { type: 'RFC', label: 'Federal Taxpayer Registry (RFC)', category: 'tax' },
    { type: 'CURP', label: 'Population Registry (CURP)', category: 'other' }
  ],
  ZA: [
    { type: 'VAT', label: 'VAT registration number', category: 'vat' },
    { type: 'INCOME_TAX', label: 'Income tax reference number', category: 'tax' },
    { type: 'CIPC', label: 'Company registration number (CIPC)', category: 'business' }
  ],
  JP: [
    { type: 'CORP_NO', label: 'Corporate Number', category: 'business' },
    { type: 'INVOICE_REG', label: 'Qualified Invoice Issuer Registration Number', category: 'vat' }
  ],
  CN: [
    { type: 'USCC', label: 'Unified Social Credit Code', category: 'business' },
    { type: 'TAX_ID', label: 'Tax registration number', category: 'tax' }
  ],
  AE: [
    { type: 'TRN', label: 'Tax Registration Number (TRN)', category: 'vat' },
    { type: 'TRADE_LICENSE', label: 'Trade licence number', category: 'business' }
  ],
  SA: [
    { type: 'VAT', label: 'VAT registration number', category: 'vat' },
    { type: 'CR', label: 'Commercial Registration (CR)', category: 'business' }
  ],
  TR: [
    { type: 'VKN', label: 'Tax Identification Number (VKN)', category: 'tax' },
    { type: 'TCKN', label: 'Turkish ID number (TCKN)', category: 'other' },
    { type: 'MERSIS', label: 'MERSIS number', category: 'business' }
  ],
  SG: [
    { type: 'UEN', label: 'Unique Entity Number (UEN)', category: 'business' },
    { type: 'GST', label: 'GST registration number', category: 'vat' }
  ],
  MY: [
    { type: 'TIN', label: 'Tax Identification Number (TIN)', category: 'tax' },
    { type: 'BRN', label: 'Business Registration Number (BRN)', category: 'business' },
    { type: 'SST', label: 'Sales and Service Tax registration', category: 'vat' }
  ],
  ID: [
    { type: 'NPWP', label: 'Taxpayer Identification Number (NPWP)', category: 'tax' },
    { type: 'NIB', label: 'Business Identification Number (NIB)', category: 'business' },
    { type: 'PKP', label: 'Taxable Entrepreneur registration (PKP)', category: 'vat' }
  ],
  NG: [
    { type: 'TIN', label: 'Tax Identification Number (TIN)', category: 'tax' },
    { type: 'RC', label: 'Corporate Affairs Commission number (RC)', category: 'business' },
    { type: 'VAT', label: 'VAT registration number', category: 'vat' }
  ],
  KE: [
    { type: 'KRA_PIN', label: 'KRA PIN', category: 'tax' },
    { type: 'BUSINESS_NO', label: 'Business registration number', category: 'business' },
    { type: 'VAT', label: 'VAT registration number', category: 'vat' }
  ],
  EG: [
    { type: 'TAX_REG', label: 'Tax registration number', category: 'tax' },
    { type: 'COMM_REG', label: 'Commercial Register number', category: 'business' },
    { type: 'VAT', label: 'VAT registration number', category: 'vat' }
  ],
  TN: [
    { type: 'MAT_FISCAL', label: 'Matricule fiscal', category: 'tax' },
    { type: 'RC', label: 'Commercial Register number', category: 'business' },
    { type: 'CNSS', label: 'CNSS social security number', category: 'social' }
  ],
  DZ: [
    { type: 'NIF', label: 'Numéro d’identification fiscale (NIF)', category: 'tax' },
    { type: 'NIS', label: 'Numéro d’identification statistique (NIS)', category: 'business' },
    { type: 'RC', label: 'Commercial Register number', category: 'business' },
    { type: 'ART', label: 'Article d’imposition', category: 'tax' }
  ],
  IL: [
    { type: 'VAT', label: 'VAT / business registration number', category: 'vat' },
    { type: 'CORP_NO', label: 'Corporations Authority number', category: 'business' }
  ],
  KR: [
    { type: 'BRN', label: 'Business Registration Number', category: 'business' },
    { type: 'VAT', label: 'VAT registration number', category: 'vat' }
  ],
  TH: [
    { type: 'TAX_ID', label: 'Tax identification number', category: 'tax' },
    { type: 'VAT', label: 'VAT registration number', category: 'vat' },
    { type: 'CORP_NO', label: 'Juristic person registration number', category: 'business' }
  ],
  PH: [
    { type: 'TIN', label: 'Tax Identification Number (TIN)', category: 'tax' },
    { type: 'SEC', label: 'SEC registration number', category: 'business' },
    { type: 'VAT', label: 'VAT registration number', category: 'vat' }
  ],
  PK: [
    { type: 'NTN', label: 'National Tax Number (NTN)', category: 'tax' },
    { type: 'STRN', label: 'Sales Tax Registration Number (STRN)', category: 'vat' },
    { type: 'SECP', label: 'SECP company registration number', category: 'business' }
  ],
  AR: [
    { type: 'CUIT', label: 'Tax Identification Code (CUIT)', category: 'tax' },
    { type: 'IIBB', label: 'Gross Income Tax registration (IIBB)', category: 'tax' },
    { type: 'REG_COM', label: 'Commercial registration', category: 'business' }
  ],
  CL: [
    { type: 'RUT', label: 'Tax Identification Number (RUT)', category: 'tax' },
    { type: 'VAT', label: 'VAT registration, where applicable', category: 'vat' }
  ],
  CO: [
    { type: 'NIT', label: 'Tax Identification Number (NIT)', category: 'tax' },
    { type: 'RUT', label: 'Tax Registry (RUT)', category: 'tax' },
    { type: 'MAT_MERCANTIL', label: 'Commercial Registry', category: 'business' }
  ],
  PE: [
    { type: 'RUC', label: 'Taxpayer Registry (RUC)', category: 'tax' }
  ],
  UY: [{ type: 'RUT', label: 'Taxpayer Registry (RUT)', category: 'tax' }],
  RU: [
    { type: 'INN', label: 'Taxpayer Identification Number (INN)', category: 'tax' },
    { type: 'KPP', label: 'Tax Registration Reason Code (KPP)', category: 'tax' },
    { type: 'OGRN', label: 'Primary State Registration Number (OGRN)', category: 'business' }
  ],
  UA: [
    { type: 'EDRPOU', label: 'Unified State Register code (EDRPOU)', category: 'business' },
    { type: 'IPN', label: 'VAT payer number (IPN)', category: 'vat' },
    { type: 'RNOKPP', label: 'Taxpayer registration number', category: 'tax' }
  ],
  NO: [
    { type: 'ORG_NO', label: 'Organisation number', category: 'business' },
    { type: 'VAT', label: 'VAT registration (MVA)', category: 'vat' }
  ],
  SE: [
    { type: 'ORG_NO', label: 'Organisation number', category: 'business' },
    { type: 'VAT', label: 'VAT number', category: 'vat' }
  ],
  DK: [
    { type: 'CVR', label: 'Central Business Register number (CVR)', category: 'business' },
    { type: 'VAT', label: 'VAT number', category: 'vat' }
  ],
  FI: [
    { type: 'BUSINESS_ID', label: 'Business ID (Y-tunnus)', category: 'business' },
    { type: 'VAT', label: 'VAT number', category: 'vat' }
  ],
  CZ: [
    { type: 'ICO', label: 'Company Identification Number (IČO)', category: 'business' },
    { type: 'DIC', label: 'Tax Identification Number (DIČ)', category: 'tax' },
    { type: 'VAT', label: 'VAT number', category: 'vat' }
  ],
  SK: [
    { type: 'ICO', label: 'Company Identification Number (IČO)', category: 'business' },
    { type: 'DIC', label: 'Tax Identification Number (DIČ)', category: 'tax' },
    { type: 'VAT', label: 'VAT number', category: 'vat' }
  ],
  HU: [
    { type: 'TAX_NO', label: 'Tax number (Adószám)', category: 'tax' },
    { type: 'VAT', label: 'EU VAT number', category: 'vat' },
    { type: 'CJSZ', label: 'Company registration number', category: 'business' }
  ],
  RO: [
    { type: 'CUI', label: 'Fiscal identification code (CUI)', category: 'tax' },
    { type: 'VAT', label: 'VAT registration number', category: 'vat' },
    { type: 'REG_COM', label: 'Trade Register number', category: 'business' }
  ],
  GR: [
    { type: 'VAT', label: 'VAT number (AFM)', category: 'vat' },
    { type: 'GEMI', label: 'General Commercial Registry (GEMI)', category: 'business' }
  ],
  BG: [
    { type: 'UIC', label: 'Unified Identification Code (UIC)', category: 'business' },
    { type: 'VAT', label: 'VAT registration number', category: 'vat' }
  ],
  HR: [
    { type: 'OIB', label: 'Personal / legal entity identification number (OIB)', category: 'tax' },
    { type: 'VAT', label: 'VAT number', category: 'vat' }
  ],
  SI: [
    { type: 'MATICNA', label: 'Registration number', category: 'business' },
    { type: 'DAVCNA', label: 'Tax number', category: 'tax' },
    { type: 'VAT', label: 'VAT number', category: 'vat' }
  ],
  LU: [
    { type: 'VAT', label: 'VAT number', category: 'vat' },
    { type: 'RCS', label: 'Trade and Companies Register number (RCS)', category: 'business' }
  ],
  IS: [
    { type: 'KENNITALA', label: 'National ID / kennitala', category: 'tax' },
    { type: 'VAT', label: 'VAT registration number', category: 'vat' }
  ],
  MT: [
    { type: 'VAT', label: 'VAT number', category: 'vat' },
    { type: 'COMPANY_NO', label: 'Company registration number', category: 'business' }
  ],
  CY: [
    { type: 'VAT', label: 'VAT number', category: 'vat' },
    { type: 'HE', label: 'Registrar of Companies number', category: 'business' }
  ]
};
const fallback: PartyIdentifierDefinition[] = [
  { type: 'TAX_ID', label: 'Tax identification number', category: 'tax' },
  { type: 'VAT', label: 'VAT / sales tax registration', category: 'vat' },
  { type: 'BUSINESS_REG', label: 'Business registration number', category: 'business' },
  { type: 'SOCIAL_REG', label: 'Social security / contribution registration', category: 'social' }
];
export function getPartyIdentifierDefinitions(countryCode?: string): PartyIdentifierDefinition[] {
  const countryDefinitions = definitions[(countryCode || '').trim().toUpperCase()] || fallback;
  const globalIdentifiers: PartyIdentifierDefinition[] = [
    { type: 'GLN', label: 'GLN (Global Location Number)', category: 'business', schemeId: '0088' },
    { type: 'DUNS', label: 'D-U-N-S Number', category: 'business', schemeId: '0060' }
  ];
  return [...countryDefinitions, ...globalIdentifiers.filter(global => !countryDefinitions.some(item => item.type === global.type))]
    .map(item => ({ ...item }));
}
export function getPartyIdentifierDefinition(countryCode: string | undefined, type: string): PartyIdentifierDefinition | undefined {
  return getPartyIdentifierDefinitions(countryCode).find(item => item.type === type);
}
/** ISO 6523 ICD examples for legal-entity identifiers, distinct from tax and electronic-address schemes. */
export const ISO_6523_LEGAL_SCHEMES = [
  { code: '0002', label: 'SIREN (France)' },
  { code: '0009', label: 'SIRET (France)' },
  { code: '0060', label: 'DUNS' },
  { code: '0088', label: 'GLN' }
] as const;


const defaultIdentifierTypes: Record<string, string[]> = {
  MA: ['ICE', 'IF'],
  FR: ['VAT', 'SIREN'],
  DE: ['VAT', 'TAX_ID'],
  GB: ['VAT', 'CRN'],
  US: ['EIN'],
  CA: ['BN', 'GST_HST'],
  ES: ['VAT', 'NIF'],
  IT: ['VAT', 'CODICE_FISCALE'],
  BE: ['VAT', 'CBE'],
  NL: ['VAT', 'KVK'],
  PT: ['VAT', 'CRC'],
  IE: ['VAT', 'CRO'],
  PL: ['VAT', 'NIP'],
  AT: ['VAT', 'FN'],
  CH: ['VAT', 'UID'],
  AU: ['ABN', 'GST'],
  NZ: ['NZBN', 'GST'],
  IN: ['GSTIN', 'PAN'],
  BR: ['CNPJ', 'IE'],
  MX: ['RFC'],
  ZA: ['VAT', 'INCOME_TAX'],
  JP: ['CORP_NO', 'INVOICE_REG'],
  CN: ['USCC', 'TAX_ID'],
  AE: ['TRN', 'TRADE_LICENSE'],
  SA: ['VAT', 'CR'],
  TR: ['VKN', 'MERSIS'],
  SG: ['UEN', 'GST'],
  MY: ['TIN', 'BRN'],
  ID: ['NPWP', 'NIB'],
  NG: ['TIN', 'RC'],
  KE: ['KRA_PIN', 'VAT'],
  EG: ['TAX_REG', 'COMM_REG'],
  TN: ['MAT_FISCAL', 'RC'],
  DZ: ['NIF', 'RC']
};

export function getDefaultPartyIdentifierDefinitions(countryCode?: string): PartyIdentifierDefinition[] {
  const code = (countryCode || '').trim().toUpperCase();
  const all = getPartyIdentifierDefinitions(code);
  const preferred = defaultIdentifierTypes[code] || all.slice(0, 2).map(item => item.type);
  return preferred
    .map(type => all.find(item => item.type === type))
    .filter((item): item is PartyIdentifierDefinition => Boolean(item))
    .map(item => ({ ...item }));
}


/** Reconcile stored identifiers when a party changes country without losing entered values. */
export function reconcilePartyIdentifiersForCountryChange(existing: PartyTaxIdentifier[], fromCountry: string | undefined, toCountry: string | undefined, idPrefix: string): PartyTaxIdentifier[] {
  const targetCountry = (toCountry || '').trim().toUpperCase();
  const sourceCountry = (fromCountry || '').trim().toUpperCase();
  const targetByType = new Map<string, PartyIdentifierDefinition>(getPartyIdentifierDefinitions(targetCountry).map(definition => [definition.type, definition] as const));
  const reconciled: PartyTaxIdentifier[] = [];
  const countryChanged = sourceCountry !== targetCountry;
  const globalTypes = new Set(['GLN', 'DUNS']);
  for (const identifier of existing) {
    if (identifier.custom || identifier.type === 'CUSTOM') {
      reconciled.push({ ...identifier, countryCode: identifier.countryCode || sourceCountry || undefined });
      continue;
    }
    const definition = targetByType.get(identifier.type);
    if (!countryChanged && definition) {
      reconciled.push({ ...identifier, label: definition.label, schemeId: definition.schemeId, countryCode: targetCountry || identifier.countryCode || undefined, custom: false });
      continue;
    }
    if (countryChanged && definition && globalTypes.has(identifier.type)) {
      reconciled.push({ ...identifier, label: definition.label, schemeId: definition.schemeId, countryCode: identifier.countryCode || targetCountry || undefined, custom: false });
      continue;
    }
    if (!countryChanged && !definition) {
      reconciled.push({ ...identifier, countryCode: identifier.countryCode || sourceCountry || undefined });
      continue;
    }
    if ((identifier.value || '').trim()) {
      const oldLabel = identifier.label || identifier.type;
      const archivedLabel = sourceCountry && !oldLabel.endsWith(`(${sourceCountry})`) ? `${oldLabel} (${sourceCountry})` : oldLabel;
      const withoutOldScheme: PartyTaxIdentifier = { ...identifier };
      delete withoutOldScheme.schemeId;
      reconciled.push({ ...withoutOldScheme, type: 'CUSTOM', label: archivedLabel, countryCode: identifier.countryCode || sourceCountry || undefined, custom: true });
    }
  }
  const representedTypes = new Set(reconciled.filter(item => !item.custom).map(item => item.type));
  for (const definition of getDefaultPartyIdentifierDefinitions(targetCountry)) {
    if (representedTypes.has(definition.type)) continue;
    reconciled.push({ id: `${idPrefix}-${Date.now()}-${reconciled.length}`, type: definition.type, label: definition.label, value: '', countryCode: targetCountry || undefined, ...(definition.schemeId ? { schemeId: definition.schemeId } : {}) });
    representedTypes.add(definition.type);
  }
  return reconciled;
}

/** Keep the legacy single taxId in sync with the active country's current identifiers. */
export function getPrimaryTaxIdentifierValue(identifiers: PartyTaxIdentifier[], countryCode?: string): string {
  const country = (countryCode || '').trim().toUpperCase();
  const current = identifiers.filter(item => !item.custom && (!item.countryCode || item.countryCode === country));
  return current.find(item => item.type === 'VAT' && (item.value || '').trim())?.value || current.find(item => ['TAX_ID', 'IF', 'EIN', 'TIN', 'NIF', 'TRN', 'RFC', 'GSTIN'].includes(item.type) && (item.value || '').trim())?.value || '';
}
