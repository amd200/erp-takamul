import { useClassic } from "@/shared/theme/ThemeProvider"
import TreasuryStatementClassic from "./TreasuryStatementClassic"
import TreasuryStatementModern from "./TreasuryStatementModern"

/** The treasury statement: the current system's layout in the classic look, erpv2's in the modern look. */
export default function TreasuryStatementPage() {
  return useClassic() ? <TreasuryStatementClassic /> : <TreasuryStatementModern />
}
