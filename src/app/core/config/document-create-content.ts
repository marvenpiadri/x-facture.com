export interface CreatePageFaq {
  question: string;
  answer: string;
}

export interface CreatePageContent {
  title: string;
  description: string;
  keywords: string;
  faqs: CreatePageFaq[];
}

export const DOCUMENT_CREATE_CONTENT: Record<string, CreatePageContent> = {
  'invoices': {
    title: 'Create Free Invoices Online',
    description: 'Generate a professional tax invoice online for free. Add your business and customer details, line items, taxes and payment terms, then download a print-ready PDF or structured electronic invoice formats.',
    keywords: 'free invoice generator, create invoice online, invoice maker, tax invoice generator, printable invoice, electronic invoice',
    faqs: [
      { question: 'What is a tax invoice?', answer: 'A tax invoice is a commercial document that records a sale of goods or services and normally identifies the seller, buyer, taxable amounts, taxes and total amount due.' },
      { question: 'Can I create an invoice for free with x-facture?', answer: 'Yes. x-facture lets you prepare invoices online for free and download the finished document as a PDF.' },
      { question: 'What information should an invoice contain?', answer: 'A complete invoice commonly includes the invoice number, issue date, seller and buyer details, line items, quantities, prices, tax information, totals and payment terms.' },
      { question: 'What is the difference between a normal PDF invoice and Factur-X?', answer: 'A normal PDF is primarily a human-readable document. Factur-X combines a readable PDF with structured XML invoice data so compatible software can process the invoice automatically.' }
    ]
  },
  'proforma-invoices': {
    title: 'Create Free Proforma Invoices Online',
    description: 'Generate a proforma invoice online for free for pre-sale quotations, advance commercial documentation, shipping preparation and transactions that have not yet become a final tax invoice.',
    keywords: 'free proforma invoice generator, create proforma invoice, proforma invoice maker, proforma invoice template',
    faqs: [
      { question: 'What is a proforma invoice?', answer: 'A proforma invoice is a preliminary commercial document used to communicate expected goods, services, prices and terms before a final invoice is issued.' },
      { question: 'Is a proforma invoice the same as a tax invoice?', answer: 'No. A proforma invoice generally communicates proposed transaction details and is not itself a final request for payment or proof of a completed taxable sale.' },
      { question: 'When should I use a proforma invoice?', answer: 'Businesses often use proforma invoices for pre-shipment documentation, customer approval, import preparation and advance pricing information.' }
    ]
  },
  'commercial-invoices': {
    title: 'Create Free Commercial Invoices Online',
    description: 'Generate a commercial invoice online for free for international trade, customs declarations and cross-border shipments, with clear seller, buyer, goods and value information.',
    keywords: 'free commercial invoice generator, customs invoice, export invoice, import invoice, international trade invoice',
    faqs: [
      { question: 'What is a commercial invoice?', answer: 'A commercial invoice is a trade document used in international shipments to describe the transaction, goods, parties and declared values used for customs and trade processing.' },
      { question: 'Why is a commercial invoice important for customs?', answer: 'Customs authorities use commercial invoice information to understand what is being shipped, who is involved, what the goods are worth and which trade or tariff rules may apply.' },
      { question: 'Is a commercial invoice the same as a normal sales invoice?', answer: 'They can contain overlapping transaction information, but a commercial invoice is specifically structured for international trade and customs purposes.' }
    ]
  },
  'quotes': {
    title: 'Create Free Quotes & Estimates Online',
    description: 'Generate a professional business quote or estimate online for free. Present services, quantities, pricing, taxes and commercial terms before a customer approves the work.',
    keywords: 'free quote generator, estimate maker, quotation generator, business quote template, price estimate',
    faqs: [
      { question: 'What is a business quote?', answer: 'A business quote is a formal price proposal that describes proposed goods or services and the price and terms offered to a customer.' },
      { question: 'Is a quote the same as an invoice?', answer: 'No. A quote is normally issued before the customer accepts the work, while an invoice records an amount owed for goods or services that have been supplied or billed.' },
      { question: 'Can a quote include taxes and payment terms?', answer: 'Yes. Including applicable taxes, validity dates, payment terms and clear line items makes a quote easier for the customer to understand and approve.' }
    ]
  },
  'purchase-orders': {
    title: 'Create Free Purchase Orders Online',
    description: 'Generate a purchase order online for free to authorize supplier purchases with item descriptions, quantities, prices, delivery requirements and buyer information.',
    keywords: 'free purchase order generator, purchase order maker, PO generator, supplier purchase order, purchase order template',
    faqs: [
      { question: 'What is a purchase order?', answer: 'A purchase order is a buyer-issued document that specifies the goods or services being ordered from a supplier and the commercial terms of the purchase.' },
      { question: 'Who creates a purchase order?', answer: 'The buyer or purchasing organization normally creates the purchase order and sends it to the supplier for processing.' },
      { question: 'Is a purchase order an invoice?', answer: 'No. A purchase order authorizes or communicates a purchase; an invoice is issued to request or document payment for a transaction.' }
    ]
  },
  'receipts': {
    title: 'Create Free Sales Receipts Online',
    description: 'Generate a sales receipt online for free as proof of payment for retail, service and counter transactions, with clear transaction, customer and payment information.',
    keywords: 'free receipt generator, sales receipt maker, payment receipt generator, printable receipt',
    faqs: [
      { question: 'What is a sales receipt?', answer: 'A sales receipt is a record showing that a customer completed a purchase or payment for goods or services.' },
      { question: 'What should a receipt show?', answer: 'A receipt commonly shows the seller, date, transaction reference, items or services, amounts paid, taxes when applicable and the payment status or method.' },
      { question: 'What is the difference between a receipt and an invoice?', answer: 'An invoice generally requests or records an amount due, while a receipt confirms that a payment or purchase has been completed.' }
    ]
  },
  'credit-notes': {
    title: 'Create Free Credit Notes Online',
    description: 'Generate a credit note online for free to document refunds, returned goods, pricing corrections, discounts or reductions against a customer balance.',
    keywords: 'free credit note generator, credit memo maker, credit note template, refund credit note',
    faqs: [
      { question: 'What is a credit note?', answer: 'A credit note is an accounting document used to reduce or correct an amount previously invoiced, for example after a return, refund or pricing adjustment.' },
      { question: 'When should a business issue a credit note?', answer: 'A credit note can be appropriate when goods are returned, an invoice was overstated, a discount is granted after invoicing or another correction reduces the customer balance.' },
      { question: 'Does a credit note replace the original invoice?', answer: 'Usually it references the original invoice and records the adjustment rather than silently replacing the original accounting document.' }
    ]
  },
  'delivery-notes': {
    title: 'Create Free Delivery Notes Online',
    description: 'Generate a delivery note or packing slip online for free to document goods dispatched, quantities delivered, receiving information and shipment instructions without exposing prices.',
    keywords: 'free delivery note generator, packing slip maker, delivery note template, dispatch note, packing list',
    faqs: [
      { question: 'What is a delivery note?', answer: 'A delivery note accompanies goods during delivery and records what was dispatched or received, helping the sender and recipient check the shipment.' },
      { question: 'Does a delivery note need prices?', answer: 'Not necessarily. Delivery notes are commonly focused on logistics and quantities, so prices can be omitted when they are not needed by the recipient.' },
      { question: 'Is a delivery note the same as a packing slip?', answer: 'They serve very similar logistics purposes. Terminology varies by country and business, with packing slip often emphasizing the contents of a shipment.' }
    ]
  },
  'timesheet-invoices': {
    title: 'Create Free Timesheet Invoices Online',
    description: 'Generate an hourly timesheet invoice online for free. Turn logged hours, billable rates, services and work descriptions into a clear client invoice.',
    keywords: 'free timesheet invoice generator, hourly invoice maker, billable hours invoice, freelancer invoice',
    faqs: [
      { question: 'What is a timesheet invoice?', answer: 'A timesheet invoice bills a customer for time-based work by showing hours or other time units, applicable rates and the resulting charges.' },
      { question: 'What should an hourly invoice include?', answer: 'Useful details include the service description, dates or period worked, hours, hourly rate, taxes, total amount and payment terms.' },
      { question: 'Who uses timesheet invoices?', answer: 'Consultants, freelancers, agencies, contractors and professional service businesses commonly use time-based invoices.' }
    ]
  },
  'work-orders': {
    title: 'Create Free Work Orders Online',
    description: 'Generate a work order or job ticket online for free to organize service requests, technician tasks, labor, materials, schedules and job instructions.',
    keywords: 'free work order generator, job ticket maker, service work order, maintenance work order',
    faqs: [
      { question: 'What is a work order?', answer: 'A work order is an operational document that authorizes or describes a job, service request, repair, maintenance task or other piece of work.' },
      { question: 'What information belongs on a work order?', answer: 'A work order can include the customer, job reference, requested work, materials, labor, instructions, dates, responsible staff and completion information.' },
      { question: 'Is a work order the same as an invoice?', answer: 'No. A work order organizes and authorizes work, while an invoice records the financial charge for goods or services.' }
    ]
  },
  'statements': {
    title: 'Create Free Statements of Account Online',
    description: 'Generate a statement of account online for free to summarize customer charges, credits, payments and outstanding balances across a billing period.',
    keywords: 'free statement of account generator, customer statement, billing statement, account statement',
    faqs: [
      { question: 'What is a statement of account?', answer: 'A statement of account summarizes financial activity between a business and a customer over a period, including charges, credits, payments and the resulting balance.' },
      { question: 'Is a statement of account an invoice?', answer: 'No. A statement summarizes account activity and balances, while an invoice normally records a specific charge or request for payment.' },
      { question: 'When should a business send a customer statement?', answer: 'Statements are useful for periodic account reviews, collections, reconciliation and keeping customers informed about their outstanding balance.' }
    ]
  },
  'service-agreements': {
    title: 'Create Free Service Agreements Online',
    description: 'Generate a service agreement online for free to document services, deliverables, rates, responsibilities, payment terms and commercial conditions.',
    keywords: 'free service agreement generator, service contract template, consulting agreement, service terms',
    faqs: [
      { question: 'What is a service agreement?', answer: 'A service agreement is a contract or commercial document describing the services to be provided and the responsibilities and terms agreed between the parties.' },
      { question: 'What should a service agreement include?', answer: 'Common sections cover the parties, scope of services, deliverables, fees, payment terms, duration, responsibilities, termination and other applicable conditions.' },
      { question: 'Is a service agreement the same as an invoice?', answer: 'No. A service agreement defines the commercial relationship and obligations, while an invoice records a charge or amount due.' }
    ]
  },
  'retainer-invoices': {
    title: 'Create Free Retainer Invoices Online',
    description: 'Generate a retainer invoice online for free for advance deposits, recurring advisory work and reserved service capacity, with clear billing and balance information.',
    keywords: 'free retainer invoice generator, retainer billing, advance invoice, recurring retainer invoice',
    faqs: [
      { question: 'What is a retainer invoice?', answer: 'A retainer invoice requests or records an advance payment that reserves services, capacity or ongoing professional support for a customer.' },
      { question: 'How is a retainer different from a normal invoice?', answer: 'A retainer commonly relates to advance or recurring payment for future or ongoing services, while a standard invoice can bill a completed or specifically delivered transaction.' },
      { question: 'Can a retainer payment be tracked against future work?', answer: 'Yes. Businesses can track the amount received and apply or reconcile it against the services covered by the retainer according to their accounting process.' }
    ]
  },
  'bills-of-lading': {
    title: 'Create Free Bills of Lading Online',
    description: 'Generate a bill of lading online for free to organize shipper, consignee, carrier, cargo, routing and freight details for commercial transport.',
    keywords: 'free bill of lading generator, BOL generator, shipping document, freight document, cargo bill of lading',
    faqs: [
      { question: 'What is a bill of lading?', answer: 'A bill of lading is a transport document that records cargo details and the parties involved in carriage and can serve important contractual and evidentiary functions.' },
      { question: 'Who uses a bill of lading?', answer: 'Shippers, carriers, freight forwarders, consignees and logistics teams use bills of lading to document the movement of goods.' },
      { question: 'Is a bill of lading an invoice?', answer: 'No. It is primarily a transport and cargo document rather than a billing document, although freight charges may be referenced in related paperwork.' }
    ]
  },
  'custom-documents': {
    title: 'Create Free Business Documents Online',
    description: 'Generate a flexible business document online for free when a standard invoice, quote, order or receipt does not fit your workflow. Build a clear printable document with your own details.',
    keywords: 'free business document generator, custom business document, business form generator, custom document maker',
    faqs: [
      { question: 'What is a custom business document?', answer: 'A custom business document is a flexible document used when a standard business form does not fully match the information or workflow you need to communicate.' },
      { question: 'When should I use a custom document?', answer: 'Use a custom document when your process needs a printable business record that does not naturally fit an invoice, quote, order, receipt or another specialized document type.' },
      { question: 'Can a custom document include pricing?', answer: 'Yes. x-facture can prepare custom documents with pricing when the selected document configuration calls for financial details.' }
    ]
  },
  'xfacture': {
    title: 'Generate Free Factur-X E-Invoices Online',
    description: 'Generate a Factur-X hybrid electronic invoice online for free. Enter seller, buyer, tax, line-item and payment data, then download a human-readable PDF or a Factur-X PDF containing structured XML invoice data.',
    keywords: 'free Factur-X generator, Factur-X invoice generator, create Factur-X online, electronic invoice, hybrid e-invoice, EN 16931, ZUGFeRD',
    faqs: [
      { question: 'What is Factur-X?', answer: 'Factur-X is a Franco-German standard for hybrid electronic invoicing that combines a human-readable PDF with structured XML invoice data for automated processing. The current official release is Factur-X 1.09.2 / ZUGFeRD 2.5.2.' },
      { question: 'Is Factur-X the same as ZUGFeRD?', answer: 'Factur-X and ZUGFeRD are technically aligned names for the same Franco-German hybrid e-invoice standard, with Factur-X used in France and ZUGFeRD used in Germany.' },
      { question: 'What does a Factur-X file contain?', answer: 'A Factur-X document contains a readable PDF representation together with structured XML invoice data. The standard is designed around the European EN 16931 semantic model and uses the UN/CEFACT Cross Industry Invoice syntax.' },
      { question: 'Why use Factur-X instead of a normal PDF invoice?', answer: 'A normal PDF is mainly designed for people to read. Factur-X adds structured invoice data so compatible accounting, procurement and e-invoicing systems can process information automatically while keeping the readable PDF.' },
      { question: 'Does Factur-X support electronic invoicing in France and Germany?', answer: 'Factur-X is a major hybrid e-invoice format in France and is technically identical to ZUGFeRD in Germany. Its specification is aligned with EN 16931 and is designed for interoperable electronic invoicing workflows.' }
    ]
  }
};

export function getCreatePageContent(routeSegment: string): CreatePageContent {
  return DOCUMENT_CREATE_CONTENT[routeSegment] || {
    title: 'Create Free Business Documents Online',
    description: 'Generate a professional business document online for free with x-facture.',
    keywords: 'free business document generator, business document maker',
    faqs: []
  };
}
