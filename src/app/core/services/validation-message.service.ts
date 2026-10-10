import { Injectable, inject } from '@angular/core';
import { LanguageService } from './language.service';

export type ValidationLanguage = 'en' | 'fr' | 'es' | 'de';

type RuleMessage = Record<ValidationLanguage, string>;

const RULE_MESSAGES: Record<string, RuleMessage> = {
  'BR-CO-26': {
    en: 'Add at least one seller identifier, such as a business registration number or VAT number, so the buyer can identify the supplier.',
    fr: 'Ajoutez au moins un identifiant du vendeur, par exemple un numéro d’immatriculation ou de TVA, afin que l’acheteur puisse identifier le fournisseur.',
    de: 'Geben Sie mindestens eine Verkäuferkennung an, zum Beispiel eine Handelsregisternummer oder Umsatzsteuer-ID, damit der Käufer den Lieferanten identifizieren kann.',
    es: 'Añade al menos un identificador del vendedor, como un número de registro mercantil o de IVA, para que el comprador pueda identificar al proveedor.'
  },
  'BR-S-02': {
    en: 'This invoice uses the standard VAT rate. Add the seller’s VAT number or another accepted tax registration identifier.',
    fr: 'Cette facture applique le taux normal de TVA. Ajoutez le numéro de TVA du vendeur ou un autre identifiant fiscal accepté.',
    de: 'Diese Rechnung verwendet den regulären Umsatzsteuersatz. Ergänzen Sie die Umsatzsteuer-ID des Verkäufers oder eine andere zulässige Steuerkennung.',
    es: 'Esta factura utiliza el tipo general de IVA. Añade el número de IVA del vendedor u otro identificador fiscal aceptado.'
  },
  'BR-CO-25': {
    en: 'The invoice must include a seller VAT identifier when required by the selected VAT rules.',
    fr: 'La facture doit inclure l’identifiant de TVA du vendeur lorsque les règles de TVA sélectionnées l’exigent.',
    de: 'Die Rechnung muss eine Umsatzsteuerkennung des Verkäufers enthalten, sofern die gewählten Umsatzsteuerregeln dies verlangen.',
    es: 'La factura debe incluir un identificador de IVA del vendedor cuando lo exijan las reglas de IVA seleccionadas.'
  },
  'BR-CO-10': {
    en: 'Check the invoice totals. The total amount must equal the sum of the invoice components.',
    fr: 'Vérifiez les totaux de la facture. Le montant total doit correspondre à la somme de ses éléments.',
    de: 'Prüfen Sie die Rechnungsbeträge. Der Gesamtbetrag muss der Summe der Rechnungsbestandteile entsprechen.',
    es: 'Comprueba los totales de la factura. El importe total debe ser igual a la suma de sus componentes.'
  },
  'BR-CO-13': {
    en: 'Check the VAT total against the taxable amounts and VAT rates.',
    fr: 'Vérifiez le total de TVA par rapport aux bases imposables et aux taux de TVA.',
    de: 'Prüfen Sie die gesamte Umsatzsteuer anhand der steuerpflichtigen Beträge und Steuersätze.',
    es: 'Comprueba el total del IVA en relación con las bases imponibles y los tipos de IVA.'
  },
  'BR-CO-15': {
    en: 'Check the amount due against the invoice total and any payments already made.',
    fr: 'Vérifiez le montant dû par rapport au total de la facture et aux paiements déjà effectués.',
    de: 'Prüfen Sie den fälligen Betrag anhand der Rechnungssumme und bereits geleisteter Zahlungen.',
    es: 'Comprueba el importe pendiente con respecto al total de la factura y los pagos ya realizados.'
  },
  'BR-01': {
    en: 'Provide a valid invoice number.',
    fr: 'Indiquez un numéro de facture valide.',
    de: 'Geben Sie eine gültige Rechnungsnummer an.',
    es: 'Introduce un número de factura válido.'
  },
  'BR-02': {
    en: 'Provide the invoice issue date.',
    fr: 'Indiquez la date d’émission de la facture.',
    de: 'Geben Sie das Rechnungsdatum an.',
    es: 'Introduce la fecha de emisión de la factura.'
  },
  'BR-CO-04': {
    en: 'Provide a valid invoice currency code.',
    fr: 'Indiquez un code de devise valide pour la facture.',
    de: 'Geben Sie einen gültigen Rechnungscode für die Währung an.',
    es: 'Introduce un código de moneda válido para la factura.'
  }
};

const FIELD_LABELS: Record<string, Record<ValidationLanguage, string>> = {
  'SellerTradeParty': { en: 'Seller details', fr: 'Informations du vendeur', es: 'Datos del vendedor', de: 'Verkäuferangaben' },
  'BuyerTradeParty': { en: 'Buyer details', fr: 'Informations de l’acheteur', es: 'Datos del comprador', de: 'Käuferangaben' },
  'SellerTradeParty/Name': { en: 'Seller name', fr: 'Nom du vendeur', es: 'Nombre del vendedor', de: 'Name des Verkäufers' },
  'BuyerTradeParty/Name': { en: 'Buyer name', fr: 'Nom de l’acheteur', es: 'Nombre del comprador', de: 'Name des Käufers' },
  'SellerTradeParty/SpecifiedTaxRegistration': { en: 'Seller tax registration', fr: 'Immatriculation fiscale du vendeur', es: 'Registro fiscal del vendedor', de: 'Steuerregistrierung des Verkäufers' },
  'ApplicableHeaderTradeAgreement': { en: 'Seller and buyer information', fr: 'Informations du vendeur et de l’acheteur', es: 'Datos del vendedor y del comprador', de: 'Angaben zu Verkäufer und Käufer' },
  'IncludedSupplyChainTradeLineItem': { en: 'Invoice line', fr: 'Ligne de facture', es: 'Línea de factura', de: 'Rechnungsposition' },
  'ApplicableTradeTax': { en: 'VAT information', fr: 'Informations de TVA', es: 'Datos del IVA', de: 'Umsatzsteuerangaben' },
  'SpecifiedTradeSettlementHeaderMonetarySummation': { en: 'Invoice totals', fr: 'Totaux de la facture', es: 'Totales de la factura', de: 'Rechnungssummen' }
};

@Injectable({ providedIn: 'root' })
export class ValidationMessageService {
  private readonly languageService = inject(LanguageService);

  formatIssue(issue: unknown, language?: ValidationLanguage): string {
    language ??= this.languageService.language().toLowerCase() as ValidationLanguage;
    if (typeof issue === 'string') return this.formatText(issue, language);
    if (!issue || typeof issue !== 'object') return this.fallbackMessage(language);

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
    return path ? `${path}: ${this.checkFieldMessage(language)}` : this.fallbackMessage(language);
  }

  private fallbackMessage(language: ValidationLanguage): string {
    const messages: Record<ValidationLanguage, string> = {
      en: 'A validation issue was reported. Review the invoice details and try again.',
      fr: 'Un problème de validation a été détecté. Vérifiez les informations de la facture et réessayez.',
      es: 'Se ha detectado un problema de validación. Revisa los datos de la factura e inténtalo de nuevo.',
      de: 'Es wurde ein Validierungsproblem festgestellt. Prüfen Sie die Rechnungsdaten und versuchen Sie es erneut.'
    };
    return messages[language];
  }

  private checkFieldMessage(language: ValidationLanguage): string {
    const messages: Record<ValidationLanguage, string> = {
      en: 'Check this field against the selected e-invoicing rules.',
      fr: 'Vérifiez ce champ selon les règles de facturation électronique sélectionnées.',
      es: 'Comprueba este campo según las reglas de facturación electrónica seleccionadas.',
      de: 'Prüfen Sie dieses Feld anhand der ausgewählten E-Rechnungsregeln.'
    };
    return messages[language];
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
