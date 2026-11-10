import { useCallback, useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { PackageSearch, Plus, RotateCw, Upload } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/StatusBadge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { DataTable, type Column } from "@/components/DataTable"
import { EmptyState } from "@/components/EmptyState"
import { PageHeader } from "@/components/PageHeader"
import { RowActions } from "@/components/RowActions"
import { formatMoney, formatNumber } from "@/lib/format"
import { Can, useCan } from "@/shared/permissions/usePermission"
import { P } from "@/shared/permissions/permissions"
import { useCategories } from "@/modules/categories/queries"
import { useDeleteProduct, useProductPage } from "../queries"
import { PRODUCT_TYPES, type Product, type ProductType } from "../types"

type Tab = "all" | ProductType
const PAGE_SIZE = 20

function StockCell({ p }: { p: Product }) {
  const { t } = useTranslation()
  if (p.balance == null) return <span className="text-faint">—</span>
  const low = (p.minStockLevel ?? 0) > 0 && (p.balance ?? 0) <= (p.minStockLevel ?? 0)
  return (
    <span className="inline-flex items-center gap-2">
      <span className="font-medium">{formatNumber(p.balance)}</span>
      {p.balance <= 0 ? <StatusBadge tone="danger">{t("products.outOfStock")}</StatusBadge> : low && <StatusBadge tone="warning">{t("products.low")}</StatusBadge>}
    </span>
  )
}

function Thumb({ p }: { p: Product }) {
  const [broken, setBroken] = useState(false)
  if (p.imageUrl && !broken) return <img src={p.imageUrl} alt="" onError={() => setBroken(true)} className="size-9 shrink-0 rounded-lg border bg-muted object-cover" />
  return <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-secondary text-[13px] font-semibold text-secondary-foreground">{p.productNameAr[0]}</div>
}

/** Items list; search, type and category are filtered by the server, a page at a time. */
export default function ProductsListPage() {
  const { t } = useTranslation()
  const can = useCan()
  const { data: categories = [] } = useCategories()
  const del = useDeleteProduct()
  const [tab, setTab] = useState<Tab>("all")
  const tabsRef = useRef<HTMLDivElement>(null)
  useEffect(() => { tabsRef.current?.querySelector("[data-state=active]")?.scrollIntoView({ inline: "nearest", block: "nearest" }) }, [tab])
  const [categoryId, setCategoryId] = useState("all")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)
  const [sort, setSort] = useState<{ key?: string; desc: boolean }>({ desc: false })
  const [toDelete, setToDelete] = useState<Product | null>(null)

  const { data, isLoading, isFetching, isError, refetch } = useProductPage({
    page: page + 1, pageSize: PAGE_SIZE, searchTerm: search,
    productType: tab === "all" ? undefined : tab,
    categoryId: categoryId === "all" ? undefined : Number(categoryId),
    sortBy: sort.key, sortDescending: sort.desc,
  })
  // Any filter change starts again from the first page.
  const onSearch = useCallback((q: string) => { setSearch((prev) => { if (prev !== q) setPage(0); return q }) }, [])

  const columns: Column<Product>[] = [
    { id: "name", sortKey: "productNameAr", header: t("products.item"), cell: (p) => (
      <div className="flex items-center gap-3">
        <Thumb p={p} />
        <div className="min-w-0">
          <div className="truncate font-semibold">{p.productNameAr}</div>
          <div className="truncate text-xs text-faint" dir="ltr">{p.productNameEn || `#${p.productCode}`}</div>
        </div>
      </div>
    ) },
    { id: "type", sortKey: "productType", header: t("products.type"), cell: (p) => <Badge variant="secondary">{t(`products.types.${p.productType}`)}</Badge> },
    { id: "category", sortKey: "categoryName", header: t("products.category"), cell: (p) => p.categoryName || "—" },
    { id: "qty", sortKey: "balance", header: t("products.quantity"), cell: (p) => <StockCell p={p} /> },
    { id: "barcode", sortKey: "barcode", header: t("products.barcode"), cell: (p) => <span className="text-muted-foreground" dir="ltr">{p.barcode || "—"}</span> },
    { id: "cost", sortKey: "costPrice", header: t("products.cost"), cell: (p) => <span className="text-muted-foreground">{p.costPrice ? formatMoney(p.costPrice) : "—"}</span> },
    { id: "price", sortKey: "sellingPrice", header: t("products.price"), cell: (p) => <span className="font-medium">{p.sellingPrice ? formatMoney(p.sellingPrice) : "—"}</span> },
    { id: "status", sortKey: "isActive", header: t("common.status"), cell: (p) => <StatusBadge tone={p.isActive ? "success" : "danger"}>{p.isActive ? t("common.active") : t("common.inactive")}</StatusBadge> },
    { id: "actions", header: "", align: "end", cell: (p) => (
      <RowActions editTo={can(P.products.edit) ? `/products/edit/${p.id}?type=${p.productType}` : undefined} onDelete={can(P.products.delete) ? () => setToDelete(p) : undefined} />
    ) },
  ]

  return (
    <>
      <PageHeader title={t("products.listTitle")}
        description={data ? t("products.listCount", { count: data.totalCount, n: formatNumber(data.totalCount) }) : t("products.listDescription")} actions={
        <>
          <Can perm={P.products.import}><Button asChild variant="outline" size="lg"><Link to="/products/import"><Upload />{t("common.import")}</Link></Button></Can>
          <Can perm={P.products.add}><Button asChild size="lg"><Link to="/products/create"><Plus />{t("products.add")}</Link></Button></Can>
        </>
      } />

      <Card className="gap-0 pt-2">
        <Tabs value={tab} onValueChange={(v) => { setTab(v as Tab); setPage(0) }} className="border-b px-4">
          <TabsList ref={tabsRef} variant="line" className="-mb-px h-[41px] max-w-full gap-4 p-0 overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <TabsTrigger value="all" className="h-full flex-none rounded-none px-1 font-normal data-active:font-medium group-data-horizontal/tabs:after:bottom-0 group-data-[variant=line]/tabs-list:data-active:text-primary group-data-[variant=line]/tabs-list:data-active:after:bg-primary">{t("products.tabs.all")}</TabsTrigger>
            {PRODUCT_TYPES.map((k) => <TabsTrigger key={k} value={k} className="h-full flex-none rounded-none px-1 font-normal data-active:font-medium group-data-horizontal/tabs:after:bottom-0 group-data-[variant=line]/tabs-list:data-active:text-primary group-data-[variant=line]/tabs-list:data-active:after:bg-primary">{t(`products.tabs.${k}`)}</TabsTrigger>)}
          </TabsList>
        </Tabs>
        <CardContent className="pt-5">
          <DataTable
            rows={data?.items}
            loading={isLoading}
            columns={columns}
            rowKey={(p) => p.id}
            searchPlaceholder={t("products.searchPlaceholder")}
            server={{ total: data?.totalCount ?? 0, page, pageSize: PAGE_SIZE, onPage: setPage, onSearch, fetching: isFetching && !isLoading,
              sort: { key: sort.key, desc: sort.desc, onSort: (key, desc) => { setSort({ key, desc }); setPage(0) } } }}
            filters={
              <Select value={categoryId} onValueChange={(v) => { setCategoryId(v); setPage(0) }}>
                <SelectTrigger className="h-10 w-44" aria-label={t("products.category")}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("products.allCategories")}</SelectItem>
                  {categories.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.parentCategoryId ? `— ${c.categoryNameAr}` : c.categoryNameAr}</SelectItem>)}
                </SelectContent>
              </Select>
            }
            empty={isError
              ? <EmptyState icon={<RotateCw />} title={t("common.loadFailed")} hint={t("common.loadFailedHint")} action={<Button variant="outline" onClick={() => refetch()}>{t("common.retry")}</Button>} />
              : <EmptyState icon={<PackageSearch />} title={t("products.empty")} hint={t("products.emptyHint")}
                  action={can(P.products.add) && <Button asChild><Link to="/products/create"><Plus />{t("products.add")}</Link></Button>} />}
          />
        </CardContent>
      </Card>

      <ConfirmDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)} pending={del.isPending}
        title={t("products.deleteTitle")} description={t("products.deleteBody", { name: toDelete?.productNameAr })}
        onConfirm={() => toDelete && del.mutate(toDelete.id, { onSuccess: () => setToDelete(null) })} />
    </>
  )
}
