import type { Tone } from '@/components/ui/Status';
import type { EventStatus, ExpenseStatus, InvoiceStatus, JobPriority, JobStage, LeadPriority, LeadStage, PayStatus, VendorStatus } from './types';

export const eventTone: Record<EventStatus, Tone> = { 'Live/Active': 'success', 'Pre-production': 'info', Planning: 'warning', Completed: 'neutral' };
export const jobTone: Record<JobStage, Tone> = { Open: 'neutral', 'In Progress': 'info', 'Pending Review': 'warning', Completed: 'success', Overdue: 'danger' };
export const leadPriorityTone: Record<LeadPriority, Tone> = { Urgent: 'danger', High: 'warning', Medium: 'info', Low: 'neutral' };
export const jobPriorityTone: Record<JobPriority, Tone> = { Urgent: 'danger', High: 'warning', Normal: 'neutral' };
export const leadStageTone: Record<LeadStage, Tone> = { 'New Inbound': 'neutral', Discovery: 'info', 'Proposal Sent': 'info', Negotiation: 'warning', 'Closed Won': 'success', 'Closed Lost': 'danger' };
export const payTone: Record<PayStatus, Tone> = { Draft: 'neutral', 'Pending Approval': 'warning', Approved: 'info', Disbursed: 'success' };
export const invoiceTone: Record<InvoiceStatus, Tone> = { Paid: 'success', Pending: 'warning', Overdue: 'danger' };
export const vendorTone: Record<VendorStatus, Tone> = { Approved: 'success', Preferred: 'info', 'Under Review': 'warning' };
export const expenseTone: Record<ExpenseStatus, Tone> = { 'Pending Approval': 'warning', Approved: 'success', Rejected: 'danger' };

/** Calendar chip surfaces per event status (chips are clickable, so they may be filled). */
export const eventChip: Record<EventStatus, string> = {
  'Live/Active': 'bg-success-soft text-success hover:brightness-95',
  'Pre-production': 'bg-primary-soft text-primary hover:brightness-95',
  Planning: 'bg-warning-soft text-warning hover:brightness-95',
  Completed: 'bg-muted text-fg-muted hover:brightness-95',
};
