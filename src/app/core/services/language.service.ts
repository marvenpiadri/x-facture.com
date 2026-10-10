import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type AppLanguage = 'EN' | 'FR' | 'ES' | 'DE';

const TRANSLATIONS: Record<AppLanguage, Record<string, string>> = {
  EN: {},
  FR: {
    'Home':'Accueil','Documents':'Documents','Invoicing & Commercial Documents':'Facturation et documents commerciaux',
    'E-Invoice Tools':'Outils de facturation électronique','Validate, convert, extract & inspect':'Valider, convertir, extraire et inspecter',
    'Validate & fix':'Valider et corriger','Validate Factur-X':'Valider Factur-X','EN 16931 profile and embedded XML checks':'Vérifications du profil EN 16931 et du XML intégré',
    'Validate CII XML':'Valider le XML CII','Validate standalone CII against the profile XSD':'Valider le CII autonome avec le schéma XSD du profil',
    'Validate Order-X':'Valider Order-X','Check purchase-order XML structure':'Vérifier la structure XML du bon de commande',
    'Convert':'Convertir','Conversion Studio':'Studio de conversion','PDF, Factur-X, CII and UBL conversion workflows':'Flux de conversion PDF, Factur-X, CII et UBL',
    'Extract & view':'Extraire et consulter','Extract XML':'Extraire le XML','Extract embedded invoice XML from Factur-X PDFs':'Extraire le XML de facture intégré aux PDF Factur-X',
    'Extract Attachments':'Extraire les pièces jointes','Inspect embedded files inside hybrid invoices':'Examiner les fichiers intégrés aux factures hybrides',
    'CII / UBL Viewer':'Visionneuse CII / UBL','Read structured invoice XML as a human document':'Lire le XML structuré d’une facture sous forme lisible',
    'Operations':'Gestion','Business Operations & Records':'Gestion et dossiers de l’entreprise','Business Dashboard':'Tableau de bord','KPI metrics, revenue graphs, and recent transactions':'Indicateurs clés, graphiques de revenus et transactions récentes',
    'POS Terminal Register':'Caisse de point de vente','Live checkout, barcode scanner, till session':'Encaissement, lecteur de codes-barres et session de caisse',
    'Smart Financial Ledger':'Grand livre financier','Real-time revenue, expense & payment log':'Suivi en temps réel des revenus, dépenses et paiements',
    'Client Directory & CRM':'Répertoire clients et CRM','Accounts, tax IDs, and billing contacts':'Comptes, identifiants fiscaux et contacts de facturation',
    'Product & Services Catalog':'Catalogue de produits et services','Item pricing, SKU, barcodes, and inventory':'Prix, références SKU, codes-barres et stock',
    'System & Company Settings':'Paramètres du système et de l’entreprise','Tax rates, currency, company profile, data':'Taux de taxe, devise, profil de l’entreprise et données',
    'Taxes, company details, currency & POS':'Taxes, informations de l’entreprise, devise et caisse',
    'System Preferences':'Préférences système','Appearance':'Apparence','Dark Theme':'Thème sombre','Light Theme':'Thème clair','Language':'Langue',
    'Template:':'Modèle :','Modern':'Moderne','Minimal':'Minimaliste','Bold':'Gras','80mm Thermal':'Thermique 80 mm','Paper:':'Papier :',
    'Edit':'Modifier','Duplicate':'Dupliquer','Mark Paid':'Marquer comme payé','Mark Sent':'Marquer comme envoyé','Mark this document as fully settled':'Marquer ce document comme entièrement réglé',
    'Choose document output':'Choisir le format du document','Standard PDF':'PDF standard','Factur-X PDF':'PDF Factur-X','Preparing…':'Préparation…','Download':'Télécharger','Download PDF':'Télécharger le PDF','Print':'Imprimer',
    'Loading document preview...':'Chargement de l’aperçu du document…','Document Not Found':'Document introuvable','The requested document could not be located in your local database.':'Le document demandé est introuvable dans votre base de données locale.','Back to':'Retour à',
    'Receipt #:':'N° de reçu :','Date:':'Date :','Cashier:':'Caissier :','Customer:':'Client :','Item':'Article','Qty':'Qté','Price':'Prix','Total':'Total','Subtotal':'Sous-total','Discount':'Remise','TOTAL DUE':'TOTAL À PAYER','Change Given':'Monnaie rendue',
    'ISSUE DATE':'DATE D’ÉMISSION','DUE DATE':'DATE D’ÉCHÉANCE','Order ref.:':'Réf. commande :','Delivered:':'Livré le :','FROM':'ÉMETTEUR','BILL TO':'FACTURER À','DELIVERY':'LIVRAISON','Delivery date:':'Date de livraison :','Carrier:':'Transporteur :','Tracking:':'Suivi :','Terms:':'Conditions :',
    'Unit price':'Prix unitaire','Hours':'Heures','Hourly Rate':'Taux horaire','VAT %':'TVA %','Quantity / Packages':'Quantité / Colis','Notes / Cargo Specification':'Notes / Description de la marchandise',
    'VAT BREAKDOWN':'DÉTAIL DE LA TVA','VAT category':'Catégorie de TVA','Rate':'Taux','Taxable amount':'Montant taxable','Tax amount':'Montant de la taxe','PAYMENT DETAILS':'DÉTAILS DE PAIEMENT','NOTES':'NOTES','TOTALS':'TOTAUX','Net total':'Total HT','Shipping / Freight':'Transport / Fret','Delivery Discount':'Remise sur livraison','Tax Basis':'Base taxable','VAT total':'Total TVA','Gross total':'Total TTC','Paid':'Payé','Amount due':'Montant dû',
    'INVOICE':'FACTURE','INVOICE NUMBER':'NUMÉRO DE FACTURE','Tax ID:':'N° fiscal :','Tax number:':'Numéro fiscal :','Invoice':'Facture','Invoices':'Factures','Factur-X Documents':'Documents Factur-X','Credit Notes':'Avoirs','Order-X Purchase Orders':'Bons de commande Order-X',
    'Edit document fields':'Modifier les champs du document','Download selected document output':'Télécharger le format de document sélectionné','management':'gestion','Preview':'Aperçu','Settings':'Paramètres','POS Register':'Caisse','Financial Ledger':'Grand livre financier','Clients & CRM':'Clients et CRM','Products & Services':'Produits et services','Net':'HT','Tax':'Taxe',
    'New Invoice':'Nouvelle facture','New Factur-X':'Nouveau Factur-X','New Proforma Invoice':'Nouvelle facture pro forma','New Commercial Invoice':'Nouvelle facture commerciale','New Quote / Estimate':'Nouveau devis','New Purchase Order':'Nouvelle commande','New Sales Receipt':'Nouveau reçu de vente','New Credit Note / Memo':'Nouvel avoir','New Delivery Note / Packing Slip':'Nouveau bon de livraison','New Timesheet Invoice':'Nouvelle facture de temps','New Work Order / Job Ticket':'Nouvel ordre de travail','New Statement of Account':'Nouveau relevé de compte','New Service Agreement / Contract':'Nouveau contrat de service','New Retainer Invoice':'Nouvelle facture d’acompte','New Bill of Lading':'Nouveau connaissement','New Custom Document':'Nouveau document personnalisé',
    'Proforma Invoice':'Facture pro forma','Proforma Invoices':'Factures pro forma','Commercial Invoice':'Facture commerciale','Commercial Invoices':'Factures commerciales','Quote / Estimate':'Devis','Quotes & Estimates':'Devis et estimations','Purchase Order':'Commande','Purchase Orders':'Commandes','Sales Receipt':'Reçu de vente','Sales Receipts':'Reçus de vente','Credit Note / Memo':'Avoir','Delivery Note / Packing Slip':'Bon de livraison','Delivery Notes':'Bons de livraison','Timesheet Invoice':'Facture de temps','Timesheet Invoices':'Factures de temps','Work Order / Job Ticket':'Ordre de travail','Work Orders':'Ordres de travail','Statement of Account':'Relevé de compte','Statements of Account':'Relevés de compte','Service Agreement / Contract':'Contrat de service','Service Agreements':'Contrats de service','Retainer Invoice':'Facture d’acompte','Retainer Invoices':'Factures d’acompte','Bill of Lading':'Connaissement','Bills of Lading':'Connaissements','Custom Document':'Document personnalisé','Custom Documents':'Documents personnalisés',
    'The requested document':'Le document demandé','could not be located in your local database.':'est introuvable dans votre base de données locale.'
  },
  ES: {
    'Home':'Inicio','Documents':'Documentos','Invoicing & Commercial Documents':'Facturación y documentos comerciales',
    'E-Invoice Tools':'Herramientas de factura electrónica','Validate, convert, extract & inspect':'Validar, convertir, extraer e inspeccionar',
    'Validate & fix':'Validar y corregir','Validate Factur-X':'Validar Factur-X','EN 16931 profile and embedded XML checks':'Comprobaciones del perfil EN 16931 y del XML integrado',
    'Validate CII XML':'Validar XML CII','Validate standalone CII against the profile XSD':'Validar CII independiente con el esquema XSD del perfil',
    'Validate Order-X':'Validar Order-X','Check purchase-order XML structure':'Comprobar la estructura XML del pedido',
    'Convert':'Convertir','Conversion Studio':'Estudio de conversión','PDF, Factur-X, CII and UBL conversion workflows':'Flujos de conversión PDF, Factur-X, CII y UBL',
    'Extract & view':'Extraer y ver','Extract XML':'Extraer XML','Extract embedded invoice XML from Factur-X PDFs':'Extraer el XML de factura integrado en PDF Factur-X',
    'Extract Attachments':'Extraer archivos adjuntos','Inspect embedded files inside hybrid invoices':'Inspeccionar archivos integrados en facturas híbridas',
    'CII / UBL Viewer':'Visor CII / UBL','Read structured invoice XML as a human document':'Leer el XML estructurado de una factura en formato legible',
    'Operations':'Operaciones','Business Operations & Records':'Operaciones y registros de la empresa','Business Dashboard':'Panel de empresa','KPI metrics, revenue graphs, and recent transactions':'Indicadores, gráficos de ingresos y transacciones recientes',
    'POS Terminal Register':'Terminal de punto de venta','Live checkout, barcode scanner, till session':'Cobro, lector de códigos de barras y sesión de caja',
    'Smart Financial Ledger':'Libro financiero','Real-time revenue, expense & payment log':'Registro en tiempo real de ingresos, gastos y pagos',
    'Client Directory & CRM':'Directorio de clientes y CRM','Accounts, tax IDs, and billing contacts':'Cuentas, identificadores fiscales y contactos de facturación',
    'Product & Services Catalog':'Catálogo de productos y servicios','Item pricing, SKU, barcodes, and inventory':'Precios, referencias SKU, códigos de barras e inventario',
    'System & Company Settings':'Configuración del sistema y la empresa','Tax rates, currency, company profile, data':'Impuestos, moneda, perfil de empresa y datos',
    'Taxes, company details, currency & POS':'Impuestos, datos de empresa, moneda y punto de venta',
    'System Preferences':'Preferencias del sistema','Appearance':'Apariencia','Dark Theme':'Tema oscuro','Light Theme':'Tema claro','Language':'Idioma',
    'Template:':'Plantilla:','Modern':'Moderno','Minimal':'Minimalista','Bold':'Negrita','80mm Thermal':'Térmico de 80 mm','Paper:':'Papel:',
    'Edit':'Editar','Duplicate':'Duplicar','Mark Paid':'Marcar como pagado','Mark Sent':'Marcar como enviado','Mark this document as fully settled':'Marcar este documento como totalmente liquidado',
    'Choose document output':'Elegir formato del documento','Standard PDF':'PDF estándar','Factur-X PDF':'PDF Factur-X','Preparing…':'Preparando…','Download':'Descargar','Download PDF':'Descargar PDF','Print':'Imprimir',
    'Loading document preview...':'Cargando vista previa del documento…','Document Not Found':'Documento no encontrado','The requested document could not be located in your local database.':'No se ha encontrado el documento solicitado en la base de datos local.','Back to':'Volver a',
    'Receipt #:':'N.º de recibo:','Date:':'Fecha:','Cashier:':'Cajero:','Customer:':'Cliente:','Item':'Artículo','Qty':'Cant.','Price':'Precio','Total':'Total','Subtotal':'Subtotal','Discount':'Descuento','TOTAL DUE':'TOTAL A PAGAR','Change Given':'Cambio entregado',
    'ISSUE DATE':'FECHA DE EMISIÓN','DUE DATE':'FECHA DE VENCIMIENTO','Order ref.:':'Ref. del pedido:','Delivered:':'Entregado:','FROM':'EMISOR','BILL TO':'FACTURAR A','DELIVERY':'ENTREGA','Delivery date:':'Fecha de entrega:','Carrier:':'Transportista:','Tracking:':'Seguimiento:','Terms:':'Condiciones:',
    'Unit price':'Precio unitario','Hours':'Horas','Hourly Rate':'Tarifa por hora','VAT %':'IVA %','Quantity / Packages':'Cantidad / Paquetes','Notes / Cargo Specification':'Notas / Descripción de la carga',
    'VAT BREAKDOWN':'DESGLOSE DEL IVA','VAT category':'Categoría de IVA','Rate':'Tipo','Taxable amount':'Base imponible','Tax amount':'Importe del impuesto','PAYMENT DETAILS':'DETALLES DE PAGO','NOTES':'NOTAS','TOTALS':'TOTALES','Net total':'Total neto','Shipping / Freight':'Envío / Transporte','Delivery Discount':'Descuento de entrega','Tax Basis':'Base imponible','VAT total':'Total IVA','Gross total':'Total bruto','Paid':'Pagado','Amount due':'Importe pendiente',
    'INVOICE':'FACTURA','Tax ID:':'N.º fiscal:','Tax number:':'Número fiscal:','Invoice':'Factura','Invoices':'Facturas','Factur-X Documents':'Documentos Factur-X','Credit Notes':'Notas de crédito','Order-X Purchase Orders':'Pedidos de compra Order-X',
    'Edit document fields':'Editar los campos del documento','Download selected document output':'Descargar el formato de documento seleccionado','management':'gestión','Preview':'Vista previa','Settings':'Configuración','POS Register':'Caja','Financial Ledger':'Libro financiero','Clients & CRM':'Clientes y CRM','Products & Services':'Productos y servicios','Net':'Neto','Tax':'Impuesto',
    'New Invoice':'Nueva factura','New Factur-X':'Nuevo Factur-X','New Proforma Invoice':'Nueva factura pro forma','New Commercial Invoice':'Nueva factura comercial','New Quote / Estimate':'Nuevo presupuesto','New Purchase Order':'Nuevo pedido de compra','New Sales Receipt':'Nuevo recibo de venta','New Credit Note / Memo':'Nueva nota de crédito','New Delivery Note / Packing Slip':'Nuevo albarán','New Timesheet Invoice':'Nueva factura de horas','New Work Order / Job Ticket':'Nueva orden de trabajo','New Statement of Account':'Nuevo extracto de cuenta','New Service Agreement / Contract':'Nuevo contrato de servicio','New Retainer Invoice':'Nueva factura de anticipo','New Bill of Lading':'Nuevo conocimiento de embarque','New Custom Document':'Nuevo documento personalizado',
    'Proforma Invoice':'Factura pro forma','Proforma Invoices':'Facturas pro forma','Commercial Invoice':'Factura comercial','Commercial Invoices':'Facturas comerciales','Quote / Estimate':'Presupuesto / Estimación','Quotes & Estimates':'Presupuestos y estimaciones','Purchase Order':'Pedido de compra','Purchase Orders':'Pedidos de compra','Sales Receipt':'Recibo de venta','Sales Receipts':'Recibos de venta','Credit Note / Memo':'Nota de crédito','Delivery Note / Packing Slip':'Albarán','Delivery Notes':'Albaranes','Timesheet Invoice':'Factura de horas','Timesheet Invoices':'Facturas de horas','Work Order / Job Ticket':'Orden de trabajo','Work Orders':'Órdenes de trabajo','Statement of Account':'Extracto de cuenta','Statements of Account':'Extractos de cuenta','Service Agreement / Contract':'Contrato de servicio','Service Agreements':'Contratos de servicio','Retainer Invoice':'Factura de anticipo','Retainer Invoices':'Facturas de anticipo','Bill of Lading':'Conocimiento de embarque','Bills of Lading':'Conocimientos de embarque','Custom Document':'Documento personalizado','Custom Documents':'Documentos personalizados',
    'The requested document':'El documento solicitado','could not be located in your local database.':'no se encuentra en la base de datos local.'
  },
  DE: {
    'Home':'Startseite','Documents':'Dokumente','Invoicing & Commercial Documents':'Rechnungs- und Geschäftsdokumente',
    'E-Invoice Tools':'E-Rechnungswerkzeuge','Validate, convert, extract & inspect':'Validieren, konvertieren, extrahieren und prüfen',
    'Validate & fix':'Validieren und korrigieren','Validate Factur-X':'Factur-X validieren','EN 16931 profile and embedded XML checks':'Prüfungen des EN-16931-Profils und des eingebetteten XML',
    'Validate CII XML':'CII-XML validieren','Validate standalone CII against the profile XSD':'Eigenständiges CII anhand des Profil-XSD validieren',
    'Validate Order-X':'Order-X validieren','Check purchase-order XML structure':'XML-Struktur der Bestellung prüfen',
    'Convert':'Konvertieren','Conversion Studio':'Konvertierungsstudio','PDF, Factur-X, CII and UBL conversion workflows':'Konvertierungsabläufe für PDF, Factur-X, CII und UBL',
    'Extract & view':'Extrahieren und anzeigen','Extract XML':'XML extrahieren','Extract embedded invoice XML from Factur-X PDFs':'Eingebettetes Rechnungs-XML aus Factur-X-PDFs extrahieren',
    'Extract Attachments':'Anhänge extrahieren','Inspect embedded files inside hybrid invoices':'Eingebettete Dateien in hybriden Rechnungen prüfen',
    'CII / UBL Viewer':'CII-/UBL-Ansicht','Read structured invoice XML as a human document':'Strukturiertes Rechnungs-XML lesbar anzeigen',
    'Operations':'Verwaltung','Business Operations & Records':'Geschäftsabläufe und Unterlagen','Business Dashboard':'Unternehmensübersicht','KPI metrics, revenue graphs, and recent transactions':'Kennzahlen, Umsatzdiagramme und aktuelle Transaktionen',
    'POS Terminal Register':'Kassenterminal','Live checkout, barcode scanner, till session':'Kassieren, Barcode-Scanner und Kassensitzung',
    'Smart Financial Ledger':'Finanzbuch','Real-time revenue, expense & payment log':'Echtzeitprotokoll für Einnahmen, Ausgaben und Zahlungen',
    'Client Directory & CRM':'Kundenverzeichnis und CRM','Accounts, tax IDs, and billing contacts':'Konten, Steuer-IDs und Rechnungskontakte',
    'Product & Services Catalog':'Produkt- und Dienstleistungskatalog','Item pricing, SKU, barcodes, and inventory':'Preise, SKUs, Barcodes und Lagerbestand',
    'System & Company Settings':'System- und Unternehmenseinstellungen','Tax rates, currency, company profile, data':'Steuersätze, Währung, Unternehmensprofil und Daten',
    'Taxes, company details, currency & POS':'Steuern, Unternehmensdaten, Währung und Kasse',
    'System Preferences':'Systemeinstellungen','Appearance':'Darstellung','Dark Theme':'Dunkles Design','Light Theme':'Helles Design','Language':'Sprache',
    'Template:':'Vorlage:','Modern':'Modern','Minimal':'Minimal','Bold':'Fett','80mm Thermal':'Thermo 80 mm','Paper:':'Papier:',
    'Edit':'Bearbeiten','Duplicate':'Duplizieren','Mark Paid':'Als bezahlt markieren','Mark Sent':'Als versendet markieren','Mark this document as fully settled':'Dieses Dokument als vollständig beglichen markieren',
    'Choose document output':'Dokumentausgabe wählen','Standard PDF':'Standard-PDF','Factur-X PDF':'Factur-X-PDF','Preparing…':'Wird vorbereitet…','Download':'Herunterladen','Download PDF':'PDF herunterladen','Print':'Drucken',
    'Loading document preview...':'Dokumentvorschau wird geladen…','Document Not Found':'Dokument nicht gefunden','The requested document could not be located in your local database.':'Das angeforderte Dokument wurde in Ihrer lokalen Datenbank nicht gefunden.','Back to':'Zurück zu',
    'Receipt #:':'Beleg-Nr.:','Date:':'Datum:','Cashier:':'Kassierer:','Customer:':'Kunde:','Item':'Artikel','Qty':'Menge','Price':'Preis','Total':'Gesamt','Subtotal':'Zwischensumme','Discount':'Rabatt','TOTAL DUE':'GESAMTBETRAG','Change Given':'Rückgeld',
    'ISSUE DATE':'AUSSTELLUNGSDATUM','DUE DATE':'FÄLLIGKEITSDATUM','Order ref.:':'Bestellreferenz:','Delivered:':'Geliefert:','FROM':'ABSENDER','BILL TO':'RECHNUNG AN','DELIVERY':'LIEFERUNG','Delivery date:':'Lieferdatum:','Carrier:':'Spediteur:','Tracking:':'Sendungsverfolgung:','Terms:':'Bedingungen:',
    'Unit price':'Stückpreis','Hours':'Stunden','Hourly Rate':'Stundensatz','VAT %':'MwSt. %','Quantity / Packages':'Menge / Pakete','Notes / Cargo Specification':'Notizen / Frachtbeschreibung',
    'VAT BREAKDOWN':'MWST.-AUFSCHLÜSSELUNG','VAT category':'MwSt.-Kategorie','Rate':'Satz','Taxable amount':'Steuerpflichtiger Betrag','Tax amount':'Steuerbetrag','PAYMENT DETAILS':'ZAHLUNGSDETAILS','NOTES':'NOTIZEN','TOTALS':'SUMMEN','Net total':'Nettosumme','Shipping / Freight':'Versand / Fracht','Delivery Discount':'Lieferrabatt','Tax Basis':'Steuerbasis','VAT total':'MwSt.-Summe','Gross total':'Bruttosumme','Paid':'Bezahlt','Amount due':'Offener Betrag',
    'INVOICE':'RECHNUNG','Tax ID:':'Steuer-ID:','Tax number:':'Steuernummer:','Invoice':'Rechnung','Invoices':'Rechnungen','Factur-X Documents':'Factur-X-Dokumente','Credit Notes':'Gutschriften','Order-X Purchase Orders':'Order-X-Bestellungen',
    'Edit document fields':'Dokumentfelder bearbeiten','Download selected document output':'Gewähltes Dokumentformat herunterladen','management':'Verwaltung','Preview':'Vorschau','Settings':'Einstellungen','POS Register':'Kasse','Financial Ledger':'Finanzbuch','Clients & CRM':'Kunden und CRM','Products & Services':'Produkte und Dienstleistungen','Net':'Netto','Tax':'Steuer',
    'New Invoice':'Neue Rechnung','New Factur-X':'Neues Factur-X','New Proforma Invoice':'Neue Pro-forma-Rechnung','New Commercial Invoice':'Neue Handelsrechnung','New Quote / Estimate':'Neues Angebot','New Purchase Order':'Neue Bestellung','New Sales Receipt':'Neuer Verkaufsbeleg','New Credit Note / Memo':'Neue Gutschrift','New Delivery Note / Packing Slip':'Neuer Lieferschein','New Timesheet Invoice':'Neue Stundenzettelrechnung','New Work Order / Job Ticket':'Neuer Arbeitsauftrag','New Statement of Account':'Neuer Kontoauszug','New Service Agreement / Contract':'Neuer Servicevertrag','New Retainer Invoice':'Neue Anzahlungsrechnung','New Bill of Lading':'Neuer Frachtbrief','New Custom Document':'Neues benutzerdefiniertes Dokument',
    'Proforma Invoice':'Pro-forma-Rechnung','Proforma Invoices':'Pro-forma-Rechnungen','Commercial Invoice':'Handelsrechnung','Commercial Invoices':'Handelsrechnungen','Quote / Estimate':'Angebot / Kostenvoranschlag','Quotes & Estimates':'Angebote und Kostenvoranschläge','Purchase Order':'Bestellung','Purchase Orders':'Bestellungen','Sales Receipt':'Verkaufsbeleg','Sales Receipts':'Verkaufsbelege','Credit Note / Memo':'Gutschrift','Delivery Note / Packing Slip':'Lieferschein','Delivery Notes':'Lieferscheine','Timesheet Invoice':'Stundenzettelrechnung','Timesheet Invoices':'Stundenzettelrechnungen','Work Order / Job Ticket':'Arbeitsauftrag','Work Orders':'Arbeitsaufträge','Statement of Account':'Kontoauszug','Statements of Account':'Kontoauszüge','Service Agreement / Contract':'Servicevertrag','Service Agreements':'Serviceverträge','Retainer Invoice':'Anzahlungsrechnung','Retainer Invoices':'Anzahlungsrechnungen','Bill of Lading':'Frachtbrief','Bills of Lading':'Frachtbriefe','Custom Document':'Benutzerdefiniertes Dokument','Custom Documents':'Benutzerdefinierte Dokumente',
    'The requested document':'Das angeforderte Dokument','could not be located in your local database.':'wurde in Ihrer lokalen Datenbank nicht gefunden.'
  }
};

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly browser = isPlatformBrowser(this.platformId);
  readonly language = signal<AppLanguage>(this.readSavedLanguage());

  private readSavedLanguage(): AppLanguage {
    if (!this.browser) return 'EN';
    try {
      const saved = localStorage.getItem('xfacture-language');
      return saved === 'FR' || saved === 'ES' || saved === 'DE' ? saved : 'EN';
    } catch {
      return 'EN';
    }
  }

  setLanguage(language: string): void {
    const normalized: AppLanguage = language === 'FR' || language === 'ES' || language === 'DE' ? language : 'EN';
    this.language.set(normalized);
    if (this.browser) {
      try { localStorage.setItem('xfacture-language', normalized); } catch { /* Storage may be disabled. */ }
    }
  }

  translate(value: string | null | undefined): string {
    if (!value) return value ?? '';
    return TRANSLATIONS[this.language()]?.[value] ?? value;
  }
}
