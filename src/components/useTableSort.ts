import { useState } from "react"
import type { TableSort } from "./DataTable"

/** Sort state for a list the server sorts: `params` go into the request (and its query key), `sort` goes to the table. */
export function useTableSort(onChange?: () => void) {
  const [state, setState] = useState<{ key?: string; desc: boolean }>({ desc: false })
  const sort: TableSort = { key: state.key, desc: state.desc, onSort: (key, desc) => { setState({ key, desc }); onChange?.() } }
  return { sort, sortBy: state.key, sortDescending: state.key ? state.desc : undefined }
}
