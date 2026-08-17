import Medusa, { FetchError } from "@medusajs/js-sdk"
import type { HttpTypes } from "@medusajs/types"

export const CART_STORAGE_KEY = "atelier-cart-id"
const LEGACY_CART_STORAGE_KEY = "atelier-cart"
const CART_FIELDS = "+items.*,+items.variant.*,+items.variant.options.*"

let sdkInstance: Medusa | null = null
let cartRequest: Promise<HttpTypes.StoreCart> | null = null

export function getCartSdk() {
  if (sdkInstance) return sdkInstance

  const { medusaBackendUrl, medusaPublishableKey } = document.documentElement.dataset
  if (!medusaPublishableKey) {
    throw new Error("Brakuje klucza publikowalnego Medusy w konfiguracji storefrontu.")
  }

  sdkInstance = new Medusa({
    baseUrl: medusaBackendUrl || "http://localhost:9000",
    publishableKey: medusaPublishableKey,
  })

  return sdkInstance
}

function emitCartChange(cart: HttpTypes.StoreCart | null) {
  window.dispatchEvent(new CustomEvent("atelier:cart-change", { detail: cart }))
}

export function getCartId() {
  return localStorage.getItem(CART_STORAGE_KEY)
}

export async function retrieveCart() {
  const cartId = getCartId()
  if (!cartId) return null

  try {
    const { cart } = await getCartSdk().store.cart.retrieve(cartId, { fields: CART_FIELDS })
    return cart
  } catch (error) {
    if (!(error instanceof FetchError) || error.status !== 404) throw error
    localStorage.removeItem(CART_STORAGE_KEY)
    emitCartChange(null)
    return null
  }
}

export async function getOrCreateCart() {
  if (cartRequest) return cartRequest

  cartRequest = (async () => {
    localStorage.removeItem(LEGACY_CART_STORAGE_KEY)
    const existingCart = await retrieveCart()
    if (existingCart) return existingCart

    const { regions } = await getCartSdk().store.region.list({ limit: 1 })
    const region = regions[0]
    if (!region) throw new Error("Sklep nie ma skonfigurowanego regionu sprzedaży.")

    const { cart } = await getCartSdk().store.cart.create(
      { region_id: region.id },
      { fields: CART_FIELDS },
    )
    localStorage.setItem(CART_STORAGE_KEY, cart.id)
    emitCartChange(cart)
    return cart
  })()

  try {
    return await cartRequest
  } finally {
    cartRequest = null
  }
}

export async function addCartItem(variantId: string, quantity = 1) {
  const cart = await getOrCreateCart()
  const { cart: updatedCart } = await getCartSdk().store.cart.createLineItem(
    cart.id,
    { variant_id: variantId, quantity },
    { fields: CART_FIELDS },
  )
  emitCartChange(updatedCart)
  return updatedCart
}

export async function updateCartItem(itemId: string, quantity: number) {
  const cartId = getCartId()
  if (!cartId) throw new Error("Nie znaleziono aktywnego koszyka.")

  const { cart } = await getCartSdk().store.cart.updateLineItem(
    cartId,
    itemId,
    { quantity },
    { fields: CART_FIELDS },
  )
  emitCartChange(cart)
  return cart
}

export async function removeCartItem(itemId: string) {
  const cartId = getCartId()
  if (!cartId) throw new Error("Nie znaleziono aktywnego koszyka.")

  const { parent: cart } = await getCartSdk().store.cart.deleteLineItem(
    cartId,
    itemId,
    { fields: CART_FIELDS },
  )
  if (!cart) throw new Error("Medusa nie zwróciła zaktualizowanego koszyka.")
  emitCartChange(cart)
  return cart
}

export function getCartQuantity(cart: HttpTypes.StoreCart | null) {
  return cart?.items?.reduce((quantity, item) => quantity + item.quantity, 0) || 0
}

export function formatCartPrice(amount: number, currencyCode: string) {
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: currencyCode.toUpperCase(),
  }).format(amount)
}
