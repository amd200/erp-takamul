import { PartyItemsReport } from "../PartyItemsReport"

/** Items sold to one customer, laid out as in the current system. */
export default function CustomerItemSalesReport() {
  return <PartyItemsReport party="customer" />
}
