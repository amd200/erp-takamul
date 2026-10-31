import type { ReactNode } from "react"
import { Building2, User } from "lucide-react"

/** The two boxes at the top of a printed-style document: the company on one side, the customer on the other, each with its icon. */
export function PartyBox({ icon, name, lines, accent }: { icon: "company" | "customer"; name: string; lines: string[]; accent: string[] }) {
  const Icon = icon === "company" ? Building2 : User
  return (
    <div className="relative space-y-1">
      <div className="absolute end-0 top-0 text-gray-400"><Icon size={48} strokeWidth={1} /></div>
      <h3 className="font-bold text-gray-800">{name || "—"}</h3>
      {lines.filter(Boolean).map((l, i) => <p key={i} className="text-sm text-gray-600">{l}</p>)}
      <div className="pt-1">{accent.filter(Boolean).map((l, i) => <p key={i} className="text-sm text-primary">{l}</p>)}</div>
    </div>
  )
}

/** A table with the solid brand-colour header row used by the current system's view pages. */
export function ColorTable({ head, children, small }: { head: ReactNode[]; children: ReactNode; small?: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className={`w-full border-collapse text-center ${small ? "text-xs" : "text-sm"}`}>
        <thead><tr className="bg-primary text-white">{head.map((h, i) => <th key={i} className={`border border-primary/20 ${small ? "p-2" : "p-3"}`}>{h}</th>)}</tr></thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}
