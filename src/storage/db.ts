import type { ExtractedInvoice } from '../types/invoice.ts';
import type { PreparedInvoiceActionCard, InvoicePaymentRecord } from '../types/transaction.ts';

const STORAGE_KEYS = {
  INVOICES: 'pharos_invoice_agent_invoices_v1',
  ACTION_CARDS: 'pharos_invoice_agent_action_cards_v1',
  PAYMENT_RECORDS: 'pharos_invoice_agent_payments_v1',
};

function safeGet<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch (e) {
    console.error(`Failed to load ${key} from localStorage:`, e);
    return defaultValue;
  }
}

function safeSet<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Failed to save ${key} to localStorage:`, e);
  }
}

export const invoiceDb = {
  getInvoices(): ExtractedInvoice[] {
    return safeGet<ExtractedInvoice[]>(STORAGE_KEYS.INVOICES, []);
  },

  saveInvoice(invoice: ExtractedInvoice): void {
    const invoices = invoiceDb.getInvoices();
    const existingIndex = invoices.findIndex((i) => i.id === invoice.id);
    if (existingIndex >= 0) {
      invoices[existingIndex] = invoice;
    } else {
      invoices.unshift(invoice);
    }
    safeSet(STORAGE_KEYS.INVOICES, invoices);
  },

  getActionCards(): PreparedInvoiceActionCard[] {
    return safeGet<PreparedInvoiceActionCard[]>(STORAGE_KEYS.ACTION_CARDS, []);
  },

  saveActionCard(card: PreparedInvoiceActionCard): void {
    const cards = invoiceDb.getActionCards();
    const existingIndex = cards.findIndex((c) => c.id === card.id);
    if (existingIndex >= 0) {
      cards[existingIndex] = card;
    } else {
      cards.unshift(card);
    }
    safeSet(STORAGE_KEYS.ACTION_CARDS, cards);
  },

  getPaymentRecords(): InvoicePaymentRecord[] {
    return safeGet<InvoicePaymentRecord[]>(STORAGE_KEYS.PAYMENT_RECORDS, []);
  },

  savePaymentRecord(record: InvoicePaymentRecord): void {
    const records = invoiceDb.getPaymentRecords();
    const existingIndex = records.findIndex((r) => r.id === record.id);
    if (existingIndex >= 0) {
      records[existingIndex] = record;
    } else {
      records.unshift(record);
    }
    safeSet(STORAGE_KEYS.PAYMENT_RECORDS, records);
  },

  getKnownReferences(): string[] {
    const invoices = invoiceDb.getInvoices();
    const records = invoiceDb.getPaymentRecords();
    const refs = new Set<string>();

    for (const inv of invoices) {
      if (inv.invoiceReference.value) {
        refs.add(inv.invoiceReference.value);
      }
    }
    for (const rec of records) {
      if (rec.invoiceReference) {
        refs.add(rec.invoiceReference);
      }
    }

    return Array.from(refs);
  },

  clearAll(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.INVOICES);
    localStorage.removeItem(STORAGE_KEYS.ACTION_CARDS);
    localStorage.removeItem(STORAGE_KEYS.PAYMENT_RECORDS);
  },
};
