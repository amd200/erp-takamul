import type { ComponentType } from "react"
import { CurrenciesList } from "./components/CurrenciesList"
import { DeliveryList } from "./components/DeliveryList"
import { DiscountsList } from "./components/DiscountsList"
import { PricingList } from "./components/PricingList"
import { ReasonsList } from "./components/ReasonsList"
import { TablesList } from "./components/TablesList"
import { TaxesList } from "./components/TaxesList"

/** The settings sections that are plain lists, by section id. */
export const LIST_SECTIONS: Record<string, ComponentType<{ readOnly: boolean }>> = {
  tables: TablesList,
  pricing_systems: PricingList,
  category_discounts: DiscountsList,
  delivery_companies: DeliveryList,
  currencies: CurrenciesList,
  taxes: TaxesList,
  tax_exemption_reasons: ReasonsList,
}
