import Medusa from "@medusajs/js-sdk"
import { getMedusaConfig } from "./config"

export interface ProductCategory {
  id: string
  name: string
  handle: string
  parent_category_id?: string | null
}

export interface ProductVariant {
  id: string
  title?: string
  sku?: string | null
  amount?: number
  currency_code?: string
  calculated_amount?: number
  calculated_price?: {
    calculated_amount?: number
    currency_code?: string
  }
  prices?: Array<{ amount: number; currency_code: string }>
  options?: Array<{ id: string; value: string; option_id: string }>
}

export interface Product {
  id: string
  title: string
  handle: string
  description?: string | null
  thumbnail?: string | null
  images?: Array<{ id: string; url: string }>
  categories?: ProductCategory[]
  variants?: ProductVariant[]
  options?: Array<{ id: string; title: string; values?: Array<{ id: string; value: string }> }>
}

const { backendUrl, publishableKey } = getMedusaConfig()

export const sdk = new Medusa({ baseUrl: backendUrl, publishableKey })

export async function getStorefrontData(productLimit = 100) {
  const [categoriesData, regionsData] = await Promise.all([
    sdk.store.category.list({ limit: 100 }),
    sdk.store.region.list({ limit: 1 }),
  ])

  const regionId = regionsData.regions[0]?.id
  const productsData = await sdk.store.product.list({
    limit: productLimit,
    fields: "*variants.calculated_price,*categories,*images,*options,*variants.options",
    ...(regionId ? { region_id: regionId } : {}),
  })

  return {
    categories: categoriesData.product_categories as ProductCategory[],
    products: productsData.products as Product[],
  }
}

export async function getCategoryByHandle(handle: string, categories?: ProductCategory[]) {
  if (categories) return categories.find((category) => category.handle === handle)
  const { product_categories } = await sdk.store.category.list({ handle, limit: 1 })
  return product_categories[0] as ProductCategory | undefined
}

export async function getProductByHandle(handle: string) {
  const { regions } = await sdk.store.region.list({ limit: 1 })
  const regionId = regions[0]?.id
  const { products } = await sdk.store.product.list({
    handle,
    limit: 1,
    fields: "*variants.calculated_price,*categories,*images,*options,*variants.options",
    ...(regionId ? { region_id: regionId } : {}),
  })
  return products[0] as Product | undefined
}

export function formatProductPrice(product: Product) {
  const variant = product.variants?.[0]
  return variant ? formatVariantPrice(variant) : "Cena na zapytanie"
}

export function formatVariantPrice(variant: ProductVariant) {
  const calculatedPrice = variant?.calculated_price
  const amount = calculatedPrice?.calculated_amount ?? variant?.calculated_amount ?? variant?.prices?.[0]?.amount ?? variant?.amount
  const currency = calculatedPrice?.currency_code ?? variant?.currency_code ?? variant?.prices?.[0]?.currency_code

  if (typeof amount !== "number" || !currency) return "Cena na zapytanie"

  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount)
}
