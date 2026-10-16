export type Role = 'MD_CEO' | 'DEPT_HEAD' | 'MANAGER' | 'TEAM_LEAD' | 'EXECUTIVE';

export interface Persona {
  id: string;
  name: string;
  role: Role;
  title: string;
  employeeCode: string;
}

export type EventStatus = 'Planning' | 'Pre-production' | 'Live/Active' | 'Completed';

export interface ProductionEvent {
  code: string;
  title: string;
  client: string;
  venue: string;
  city: City;
  venueSpec: string;
  start: string;
  end: string;
  status: EventStatus;
  budget: number;
  capacity: number;
  lead: string;
  format: string;
}

export type City = 'Chennai' | 'Bengaluru' | 'Hyderabad' | 'Kochi' | 'Coimbatore' | 'Madurai' | 'Mysuru' | 'Visakhapatnam';
export type IndianState = 'Tamil Nadu' | 'Karnataka' | 'Kerala' | 'Telangana' | 'Andhra Pradesh' | 'Puducherry';

export type LeadStage = 'New Inbound' | 'Discovery' | 'Proposal Sent' | 'Negotiation' | 'Closed Won' | 'Closed Lost';
export type LeadPriority = 'Urgent' | 'High' | 'Medium' | 'Low';

/** itemId → quantity */
export type GearRequest = Record<string, number>;

export interface Lead {
  id: string;
  organization: string;
  contact: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: IndianState;
  product: string;
  value: number;
  kits: string;
  gear: GearRequest;
  executive: string;
  priority: LeadPriority;
  stage: LeadStage;
  notes: string;
  convertedTo: string | null;
}

export type Depot = 'Chennai Ambattur Central Hub' | 'Bengaluru Peenya Depot' | 'Hyderabad Sanathnagar Yard' | 'Kochi Kalamassery Unit';
export type AssetCategory = 'LED & Visuals' | 'Audio' | 'Lighting' | 'Rigging' | 'Power' | 'Comms' | 'Exhibition';

export interface InventoryItem {
  id: string;
  name: string;
  shortName: string;
  spec: string;
  category: AssetCategory;
  depot: Depot;
  total: number;
  dailyRate: number;
}

export type JobStage = 'Open' | 'In Progress' | 'Pending Review' | 'Completed' | 'Overdue';
export type JobPriority = 'Urgent' | 'High' | 'Normal';

export interface GearLine { itemId: string; qty: number }
export interface Deliverable { id: string; text: string; done: boolean }

export interface JobOrder {
  no: string;
  title: string;
  eventCode: string;
  department: Department;
  executive: string;
  teamLead: string;
  manager: string;
  priority: JobPriority;
  stage: JobStage;
  due: string;
  gear: GearLine[];
  deliverables: Deliverable[];
}

export type VendorSpecialty = 'Audio & Sound' | 'Stage & Rigging' | 'LED & Visuals' | 'Lighting & FX' | 'Catering & Dining' | 'Logistics & Heavy Cranes' | 'Decor & Florals';
export type Hub = 'Chennai' | 'Bengaluru' | 'Hyderabad' | 'Kochi' | 'Coimbatore' | 'Madurai';
export type PaymentTerms = 'Net 15 Days' | 'Net 30 Days' | 'Milestone 50-50';
export type VendorStatus = 'Approved' | 'Preferred' | 'Under Review';

export interface Vendor {
  id: string;
  name: string;
  specialty: VendorSpecialty;
  hub: Hub;
  contact: string;
  phone: string;
  email: string;
  gstin: string;
  terms: PaymentTerms;
  rating: number;
  status: VendorStatus;
  totalSpend: number;
  activePOs: number;
}

export type PayStatus = 'Draft' | 'Pending Approval' | 'Approved' | 'Disbursed';
export type TransferMode = 'NEFT' | 'RTGS';

export interface Employee {
  code: string;
  name: string;
  designation: string;
  department: Department | 'Leadership';
  reportsTo: string;
  teamLead: string | null;
  attendance: number;
  leaveBalance: number;
  location: Hub;
  basic: number;
  hra: number;
  siteAllowance: number;
  tds: number;
  pf: number;
  payStatus: PayStatus;
  bankMasked: string;
  pan: string;
  transfer: { mode: TransferMode; utr: string; at: string } | null;
  payslipSentAt: string | null;
}

export interface LineItem { description: string; qty: number; rate: number }
export type GstRate = 0 | 5 | 12 | 18;
export type InvoiceStatus = 'Paid' | 'Pending' | 'Overdue';
export type BillingMilestone = 'Retainer' | 'Fabrication Advance' | 'Final Balance';

export interface CustomerInvoice {
  no: string;
  eventCode: string;
  client: string;
  milestone: BillingMilestone;
  lines: LineItem[];
  gst: GstRate;
  issuedOn: string;
  dueOn: string;
  status: InvoiceStatus;
  settledAt: string | null;
}

export interface VendorBill {
  no: string;
  vendor: string;
  eventCode: string;
  description: string;
  lines: LineItem[];
  gst: GstRate;
  dueOn: string;
  status: InvoiceStatus;
  settledAt: string | null;
}

export type Department = 'Production' | 'Marketing & Sales' | 'Operations & Logistics' | 'Creative & AV' | 'Catering & Hospitality' | 'Admin & General';
export type ExpenseProcess = 'Stage Rigging' | 'Artist Fees' | 'Venue Rental' | 'Catering' | 'Licensing & Permits' | 'Staff Travel' | 'Promotional Print' | 'Equipment Lease';
export type ExpenseStatus = 'Pending Approval' | 'Approved' | 'Rejected';

export interface Expense {
  id: string;
  date: string;
  description: string;
  department: Department;
  process: ExpenseProcess;
  eventCode: string;
  amount: number;
  status: ExpenseStatus;
  raisedBy: string;
  decidedBy: string | null;
}

export interface Dataset {
  events: ProductionEvent[];
  leads: Lead[];
  inventory: InventoryItem[];
  jobs: JobOrder[];
  vendors: Vendor[];
  employees: Employee[];
  invoices: CustomerInvoice[];
  bills: VendorBill[];
  expenses: Expense[];
}
