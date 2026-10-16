import type {
  AssetCategory, BillingMilestone, City, Department, Depot, EventStatus, ExpenseProcess, GstRate, Hub,
  IndianState, JobPriority, JobStage, LeadPriority, LeadStage, PaymentTerms, PayStatus, VendorSpecialty, VendorStatus,
} from './types';

export const LEAD_STAGES: LeadStage[] = ['New Inbound', 'Discovery', 'Proposal Sent', 'Negotiation', 'Closed Won', 'Closed Lost'];
export const OPEN_LEAD_STAGES: LeadStage[] = ['New Inbound', 'Discovery', 'Proposal Sent', 'Negotiation'];
export const LEAD_PRIORITIES: LeadPriority[] = ['Urgent', 'High', 'Medium', 'Low'];
export const EVENT_STATUSES: EventStatus[] = ['Planning', 'Pre-production', 'Live/Active', 'Completed'];
export const JOB_STAGES: JobStage[] = ['Open', 'In Progress', 'Pending Review', 'Completed', 'Overdue'];
export const JOB_FLOW: JobStage[] = ['Open', 'In Progress', 'Pending Review', 'Completed'];
export const JOB_PRIORITIES: JobPriority[] = ['Urgent', 'High', 'Normal'];
export const DEPOTS: Depot[] = ['Chennai Ambattur Central Hub', 'Bengaluru Peenya Depot', 'Hyderabad Sanathnagar Yard', 'Kochi Kalamassery Unit'];
export const DEPOT_SHORT: Record<Depot, string> = {
  'Chennai Ambattur Central Hub': 'Ambattur',
  'Bengaluru Peenya Depot': 'Peenya',
  'Hyderabad Sanathnagar Yard': 'Sanathnagar',
  'Kochi Kalamassery Unit': 'Kalamassery',
};
export const DEPOT_CITY: Record<Depot, Hub> = {
  'Chennai Ambattur Central Hub': 'Chennai',
  'Bengaluru Peenya Depot': 'Bengaluru',
  'Hyderabad Sanathnagar Yard': 'Hyderabad',
  'Kochi Kalamassery Unit': 'Kochi',
};
export const ASSET_CATEGORIES: AssetCategory[] = ['LED & Visuals', 'Audio', 'Lighting', 'Rigging', 'Power', 'Comms', 'Exhibition'];
export const SPECIALTIES: VendorSpecialty[] = ['Audio & Sound', 'Stage & Rigging', 'LED & Visuals', 'Lighting & FX', 'Catering & Dining', 'Logistics & Heavy Cranes', 'Decor & Florals'];
export const HUBS: Hub[] = ['Chennai', 'Bengaluru', 'Hyderabad', 'Kochi', 'Coimbatore', 'Madurai'];
export const CITIES: City[] = ['Chennai', 'Bengaluru', 'Hyderabad', 'Kochi', 'Coimbatore', 'Madurai', 'Mysuru', 'Visakhapatnam'];
export const STATES: IndianState[] = ['Tamil Nadu', 'Karnataka', 'Kerala', 'Telangana', 'Andhra Pradesh', 'Puducherry'];
export const PAYMENT_TERMS: PaymentTerms[] = ['Net 15 Days', 'Net 30 Days', 'Milestone 50-50'];
export const VENDOR_STATUSES: VendorStatus[] = ['Approved', 'Preferred', 'Under Review'];
export const PAY_STATUSES: PayStatus[] = ['Draft', 'Pending Approval', 'Approved', 'Disbursed'];
export const DEPARTMENTS: Department[] = ['Production', 'Marketing & Sales', 'Operations & Logistics', 'Creative & AV', 'Catering & Hospitality', 'Admin & General'];
export const PROCESSES: ExpenseProcess[] = ['Stage Rigging', 'Artist Fees', 'Venue Rental', 'Catering', 'Licensing & Permits', 'Staff Travel', 'Promotional Print', 'Equipment Lease'];
export const MILESTONES: BillingMilestone[] = ['Retainer', 'Fabrication Advance', 'Final Balance'];
export const GST_RATES: GstRate[] = [18, 12, 5, 0];

export const CITY_CODE: Record<string, string> = {
  Chennai: 'CHE', Bengaluru: 'BLR', Hyderabad: 'HYD', Kochi: 'KOC', Coimbatore: 'CBE', Madurai: 'MDU', Mysuru: 'MYS', Visakhapatnam: 'VSK',
};
export const CITY_STATE: Record<string, IndianState> = {
  Chennai: 'Tamil Nadu', Coimbatore: 'Tamil Nadu', Madurai: 'Tamil Nadu', Bengaluru: 'Karnataka', Mysuru: 'Karnataka',
  Kochi: 'Kerala', Hyderabad: 'Telangana', Visakhapatnam: 'Andhra Pradesh',
};

/** Q3 FY 2026–27 departmental allocations. */
export const DEPARTMENT_BUDGETS: Record<Department, number> = {
  Production: 45_00_000,
  'Marketing & Sales': 12_00_000,
  'Operations & Logistics': 28_00_000,
  'Creative & AV': 18_00_000,
  'Catering & Hospitality': 9_00_000,
  'Admin & General': 6_00_000,
};

/** Expenses above this need MD_CEO sign-off. */
export const HIGH_VALUE_EXPENSE = 5_00_000;
/** RBI: RTGS is for transfers of ₹2,00,000 and above. */
export const RTGS_THRESHOLD = 2_00_000;
/** Opening balance of the operating current account for the period. */
export const OPENING_BALANCE = 40_00_000;

export const ASSIGNABLE_EXECUTIVES = ['Gautham Vasudevan', 'Keerthana Murali', 'Lakshmi Priya S.', 'Mohammed Faizal', 'Arjun Reddy Kotha'];
export const TEAM_LEADS = ['Hariprasad Nair', 'Arjun Reddy Kotha'];
export const APPROVING_MANAGERS = ['Senthil Kumar', 'Anandha Krishnan'];
