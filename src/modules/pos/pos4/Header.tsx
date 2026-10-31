import type { ReactNode } from "react"
import { ChevronRight, MapPin, ShoppingCart } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { PublicBranch } from "./types"

/** The phone's top: the logo with the cart pill, then the branch card; the category strip rides under it, sticky. */
export function Header({ branch, itemCount, onOpenCart, children }: { branch: PublicBranch | undefined; itemCount: number; onOpenCart: () => void; children: ReactNode }) {
  const { t } = useTranslation()
  const name = branch?.name || t("pos4.branchName")
  const logo = branch?.imageUrl?.trim()
  return (
    <>
      <div className="pos4-mobile-masthead lg:hidden">
        <img src="/logo_ar_light.png" alt={t("pos4.brand")} className="pos4-brand-logo" />
        <button type="button" className="pos4-cart-pill" onClick={onOpenCart}>
          <ChevronRight size={16} aria-hidden="true" className="ltr:rotate-180" />
          <span>{t("pos4.orderCart")}</span>
          <span className="pos4-cart-pill-icon">
            <ShoppingCart size={21} aria-hidden="true" />
            {itemCount > 0 && <span className="pos4-cart-badge">{itemCount}</span>}
          </span>
        </button>
      </div>
      <div className="pos4-menu-header">
        <div className="pos4-branch-card-wrap lg:hidden">
          <section className="pos4-branch-card" aria-label={name}>
            <div className="pos4-location-icon flex size-11 shrink-0 items-center justify-center rounded-[13px] border border-[color-mix(in_srgb,var(--primary)_15%,var(--border))] bg-[var(--bg-main)] text-primary">
              {logo ? <img src={logo} alt={name} className="h-full w-full rounded-[inherit] object-contain p-1.5" /> : <MapPin size={20} strokeWidth={1.7} aria-hidden="true" />}
            </div>
            <div className="pos4-branch-text min-w-0">
              <h1 className="pos4-branch-name">{name}</h1>
              {branch?.shortName && branch.shortName !== name && <p className="pos4-branch-subtitle">{branch.shortName}</p>}
            </div>
          </section>
        </div>
        {children}
      </div>
    </>
  )
}
