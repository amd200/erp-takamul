import { StatementReport } from "../StatementReport"

/** Supplier account statement, laid out as in the current system. */
export default function SupplierStatementReport() {
  return <StatementReport party="supplier" />
}
