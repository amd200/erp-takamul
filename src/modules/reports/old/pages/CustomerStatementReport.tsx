import { StatementReport } from "../StatementReport"

/** Customer account statement, laid out as in the current system. */
export default function CustomerStatementReport() {
  return <StatementReport party="customer" />
}
