import { Injectable } from '@angular/core';

export type ValidationLanguage = 'en' | 'fr' | 'de';

type RuleMessage = Record<ValidationLanguage, string>;

const RULE_MESSAGES: Record<string, RuleMessage> = {
  'BR-CO-26': {
    en: 'Add at least one seller identifier, such as a business registration number or VAT number, so the buyer can identify the supplier.',
    fr: 'Ajoutez au moins un identifiant du vendeur, par exemple un numéro d’immatriculation ou de TVA, afin que l’acheteur puisse identifier le fournisseur.',
    de: 'Geben Sie mindestens eine Verkäuferkennung an, zum Beispiel eine Handelsregisternummer oder Umsatzsteuer-ID, damit der Käufer den Lieferanten identifizieren kann.'
  },
  'BR-S-02': {
    en: 'This invoice uses the standard VAT rate. Add the seller’s VAT number or another accepted tax registration identifier.',
    fr: 'Cette facture applique le taux normal de TVA. Ajoutez le numéro de TVA du vendeur ou un autre identifiant fiscal accepté.',
    de: 'Diese Rechnung verwendet den regulären Umsatzsteuersatz. Ergänzen Sie die Umsatzsteuer-ID des Verkäufers oder eine andere zulässige Steuerkennung.'
  },
  'BR-CO-25': {
    en: 'The invoice must include a seller VAT identifier when required by the selected VAT rules.',
    fr: 'La facture doit inclure l’identifiant de TVA du vendeur lorsque les règles de TVA sélectionnées l’exigent.',
    de: 'Die Rechnung muss eine Umsatzsteuerkennung des Verkäufers enthalten, sofern die gewählten Umsatzsteuerregeln dies verlangen.'
  },
  'BR-CO-10': {
    en: 'Check the invoice totals. The total amount must equal the sum of the invoice components.',
    fr: 'Vérifiez les totaux de la facture. Le montant total doit correspondre à la somme de ses éléments.',
    de: 'Prüfen Sie die Rechnungsbeträge. Der Gesamtbetrag muss der Summe der Rechnungsbestandteile entsprechen.'
  },
  'BR-CO-13': {
    en: 'Check the VAT total against the taxable amounts and VAT rates.',
    fr: 'Vérifiez le total de TVA par rapport aux bases imposables et aux taux de TVA.',
    de: 'Prüfen Sie die gesamte Umsatzsteuer anhand der steuerpflichtigen Beträge und Steuersätze.'
  },
  'BR-CO-15': {
    en: 'Check the amount due against the invoice total and any payments already made.',
    fr: 'Vérifiez le montant dû par rapport au total de la facture et aux paiements déjà effectués.',
    de: 'Prüfen Sie den fälligen Betrag anhand der Rechnungssumme und bereits geleisteter Zahlungen.'
  },
  'BR-01': {
    en: 'Provide a valid invoice number.',
    fr: 'Indiquez un numéro de facture valide.',
    de: 'Geben Sie eine gültige Rechnungsnummer an.'
  },
  'BR-02': {
    en: 'Provide the invoice issue date.',
    fr: 'Indiquez la date d’émission de la facture.',
    de: 'Geben Sie das Rechnungsdatum an.'
  },
  'BR-CO-04': {
    en: 'Provide a valid invoice currency code.',
    fr: 'Indiquez un code de devise valide pour la facture.',
    de: 'Geben Sie einen gültigen Rechnungscode für die Währung an.'
  }
};

const FIELD_LABELS: Record<string, Record<ValidationLanguage, string>> = {
  'SellerTradeParty': { en: 'Seller details', fr: 'Informations du vendeur', de: 'Verkäuferangaben' },
  'BuyerTradeParty': { en: 'Buyer details', fr: 'Informations de l’acheteur', de: 'Käuferangaben' },
  'SellerTradeParty/Name': { en: 'Seller name', fr: 'Nom du vendeur', de: 'Name des Verkäufers' },
  'BuyerTradeParty/Name': { en: 'Buyer name', fr: 'Nom de l’acheteur', de: 'Name des Käufers' },
  'SellerTradeParty/SpecifiedTaxRegistration': { en: 'Seller tax registration', fr: 'Immatriculation fiscale du vendeur', de: 'Steuerregistrierung des Verkäufers' },
  'ApplicableHeaderTradeAgreement': { en: 'Seller and buyer information', fr: 'Informations du vendeur et de l’acheteur', de: 'Angaben zu Verkäufer und Käufer' },
  'IncludedSupplyChainTradeLineItem': { en: 'Invoice line', fr: 'Ligne de facture', de: 'Rechnungsposition' },
  'ApplicableTradeTax': { en: 'VAT information', fr: 'Informations de TVA', de: 'Umsatzsteuerangaben' },
  'SpecifiedTradeSettlementHeaderMonetarySummation': { en: 'Invoice totals', fr: 'Totaux de la facture', de: 'Rechnungssummen' }
};

@Injectable({ providedIn: 'root' })
export class ValidationMessageService {
  formatIssue(issue: unknown, language: ValidationLanguage = 'en'): string {
    if (typeof issue === 'string') return this.formatText(issue, language);
    if (!issue || typeof issue !== 'object') return 'A validation issue was reported. Review the invoice details and try again.';

    const detail = issue as Record<string, unknown>;
    const message = ['message', 'text', 'error', 'description', 'title', 'rule']
      .map(key => detail[key])
      .find(value => typeof value === 'string' && value.trim());
    const code = this.extractRuleCode(
      typeof detail['code'] === 'string' ? detail['code'] : '',
      typeof message === 'string' ? message : '',
      typeof detail['rule'] === 'string' ? detail['rule'] : ''
    );
    const friendly = code ? RULE_MESSAGES[code]?.[language] : undefined;
    const path = this.humanizePath(
      ['field', 'path', 'location'].map(key => detail[key]).find(value => typeof value === 'string' && value.trim()) as string | undefined,
      language
    );

    if (friendly) return path ? `${path}: ${friendly} (${code})` : `${friendly} (${code})`;
    if (typeof message === 'string') return this.formatText(message, language, path);
    if (Array.isArray(detail['errors'])) return detail['errors'].map(item => this.formatIssue(item, language)).join(' ');
    return path ? `${path}: Check this field against the selected e-invoicing rules.` : 'A validation issue was reported. Review the invoice details and try again.';
  }

  private formatText(text: string, language: ValidationLanguage, path?: string): string {
    const code = this.extractRuleCode(text);
    const translated = code ? RULE_MESSAGES[code]?.[language] : undefined;
    if (translated) return `${path ? path + ': ' : ''}${translated} (${code})`;

    // Schematron often returns a long namespace-heavy XPath. Show only a useful field
    // label and the rule message, never the raw machine path.
    const cleaned = text
      .replace(/\/\*\:[^\s:]+\[namespace-uri\(\)='[^']+'\]\[\d+\]/g, '')
      .replace(/\/\*\:[^\s:]+\[\d+\]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    const readable = cleaned.replace(/^.*?:\s*(\[(?:BR|PEPPOL)[A-Z0-9-]+\].*)$/i, '$1');
    if (!readable || readable === text.trim()) {
      const fallback = text.match(/\[(?:BR|PEPPOL)[A-Z0-9-]+\].*/i)?.[0] || text;
      return `${path ? path + ': ' : ''}${fallback}`;
    }
    return `${path ? path + ': ' : ''}${readable}`;
  }

  private extractRuleCode(...values: string[]): string | undefined {
    for (const value of values) {
      const match = value.match(/\[((?:BR|PEPPOL)[A-Z0-9-]+)\]/i) || value.match(/\b((?:BR|PEPPOL)[A-Z0-9-]+)\b/i);
      if (match) return match[1].toUpperCase();
    }
    return undefined;
  }

  private humanizePath(path: string | undefined, language: ValidationLanguage): string | undefined {
    if (!path) return undefined;
    for (const [fragment, labels] of Object.entries(FIELD_LABELS)) {
      if (path.includes(fragment)) return labels[language];
    }
    if (/^\s*\//.test(path) || path.includes('namespace-uri')) return undefined;
    return path.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[._/]+/g, ' ').trim();
  }
}
