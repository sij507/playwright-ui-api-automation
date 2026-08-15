import type { PaymentMethod } from '../pages/FormValidationPage';

// contactnumber must match the page's own pattern: [0-9]{3}-[0-9]{7}.
export function validTicketSubmission(
  overrides: Partial<{
    contactName: string;
    contactNumber: string;
    pickupDate: string;
    paymentMethod: PaymentMethod;
  }> = {},
) {
  return {
    contactName: overrides.contactName ?? 'John Smith',
    contactNumber: overrides.contactNumber ?? '012-3456789',
    pickupDate: overrides.pickupDate ?? '2026-09-01',
    paymentMethod: overrides.paymentMethod ?? ('cash on delivery' as PaymentMethod),
  };
}

// Same digit count as a valid number but missing the required hyphen —
// fails the field's pattern rather than being empty.
export const malformedContactNumber = '0123456789';
