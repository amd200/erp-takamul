export const adjustmentKeys = {
  all: ["adjustments"] as const,
  // Own root so a branch pick in the form reloads it (see LOOKUP_ROOTS in useFormBranch).
  stockRows: ["stock-rows"] as const,
  stock: (term: string) => ["stock-rows", term] as const,
}
