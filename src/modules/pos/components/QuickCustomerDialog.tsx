import { CustomerDialog } from "@/modules/customers/components/CustomerDialog"

/** Adds a customer without leaving the sales screen, then picks them for the sale. */
export function QuickCustomerDialog({ open, onOpenChange, onCreated, withMeasurements }: { open: boolean; onOpenChange: (o: boolean) => void; onCreated: (id: number, name: string) => void; withMeasurements?: boolean }) {
  return <CustomerDialog open={open} onOpenChange={onOpenChange} onCreated={onCreated} withMeasurements={withMeasurements} />
}
