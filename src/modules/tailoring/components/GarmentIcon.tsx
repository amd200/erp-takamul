import type { GarmentId } from "../types"

const PATHS: Record<GarmentId, string[]> = {
  thobe: ["M9 3h6l4 3-2 3-2-1v13H9V8L7 9 5 6z", "M10 3l2 3 2-3", "M12 6v6"],
  shirt: ["M8 4l4 2 4-2 4 3-2 3-2-1v11H8V9l-2 1-2-3z", "M12 6v14"],
  pants: ["M7 3h10l1 18h-4l-2-11-2 11H6z", "M7 6h10"],
  bisht: ["M8 4l-5 16h18L16 4z", "M8 4l2 16", "M16 4l-2 16", "M8 4l4 3 4-3"],
  abaya: ["M9 3h6l2 3 3 15H4L7 6z", "M12 3v18"],
  suit: ["M8 3l4 5 4-5 4 2-1 16H5L4 5z", "M12 8v13", "M8 3l-1 7 3 1", "M16 3l1 7-3 1"],
}

/** A simple outline of the garment, drawn in the current text colour. */
export function GarmentIcon({ id, className }: { id: GarmentId; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {PATHS[id].map((d) => <path key={d} d={d} />)}
    </svg>
  )
}
