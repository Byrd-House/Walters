// A normalized lead from the quote form, plus the swappable destination contract.

export interface Lead {
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
  services: string[]; // service group slugs
  timing?: string;
  message?: string;
  source: string;
  submittedAt: string; // ISO 8601
}

export interface LeadResult {
  ok: boolean;
  id?: string;
  error?: string;
}

export interface LeadDestination {
  readonly name: string;
  /** true = a successful submit here means the lead is safely captured. */
  readonly durable: boolean;
  /** Reads env; false → silently skipped (e.g. Jobber before creds exist). */
  isConfigured(): boolean;
  submit(lead: Lead): Promise<LeadResult>;
}
