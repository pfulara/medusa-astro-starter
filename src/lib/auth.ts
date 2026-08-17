import Medusa, { FetchError } from "@medusajs/js-sdk"
import type { HttpTypes } from "@medusajs/types"
import { getMedusaConfig } from "./config"

const { backendUrl, publishableKey } = getMedusaConfig()

function createAuthSdk() {
  return new Medusa({
    baseUrl: backendUrl,
    publishableKey,
    auth: { type: "jwt" },
  })
}

function authorization(token: string) {
  return { Authorization: `Bearer ${token}` }
}

export async function loginCustomer(email: string, password: string) {
  const result = await createAuthSdk().auth.login("customer", "emailpass", { email, password })
  if (typeof result !== "string") {
    throw new Error("Logowanie wymaga dodatkowego kroku, którego ten formularz nie obsługuje.")
  }
  return result
}

export async function registerCustomer(input: { email: string; password: string; first_name: string; last_name: string }) {
  const sdk = createAuthSdk()
  const registrationToken = await sdk.auth.register("customer", "emailpass", {
    email: input.email,
    password: input.password,
  })

  if (typeof registrationToken !== "string") {
    throw new Error("Rejestracja wymaga dodatkowego kroku, którego ten formularz nie obsługuje.")
  }

  await sdk.store.customer.create(
    { email: input.email, first_name: input.first_name, last_name: input.last_name },
    {},
    authorization(registrationToken),
  )

  return loginCustomer(input.email, input.password)
}

export async function retrieveCustomer(token: string) {
  const { customer } = await createAuthSdk().store.customer.retrieve(
    { fields: "*addresses" },
    authorization(token),
  )
  return customer
}

export type CustomerAddressInput = HttpTypes.StoreCreateCustomerAddress

export async function createCustomerAddress(token: string, input: CustomerAddressInput) {
  const { customer } = await createAuthSdk().store.customer.createAddress(
    input,
    { fields: "*addresses" },
    authorization(token),
  )
  return customer
}

export async function updateCustomerAddress(token: string, addressId: string, input: HttpTypes.StoreUpdateCustomerAddress) {
  const { customer } = await createAuthSdk().store.customer.updateAddress(
    addressId,
    input,
    { fields: "*addresses" },
    authorization(token),
  )
  return customer
}

export async function deleteCustomerAddress(token: string, addressId: string) {
  return createAuthSdk().store.customer.deleteAddress(addressId, authorization(token))
}

export async function transferCartToCustomer(token: string, cartId: string) {
  const { cart } = await createAuthSdk().store.cart.transferCart(
    cartId,
    {},
    authorization(token),
  )
  return cart
}

const ORDER_FIELDS = "id,display_id,status,fulfillment_status,payment_status,currency_code,total,subtotal,shipping_total,tax_total,discount_total,refunded_total,created_at,*items,*items.variant,*items.variant.product,*items.detail,*shipping_address,*shipping_methods,*fulfillments,*returns,*returns.items,*cart"

export async function listCustomerOrders(token: string, limit = 20, offset = 0) {
  return createAuthSdk().store.order.list(
    { limit, offset, order: "-created_at", fields: ORDER_FIELDS },
    authorization(token),
  )
}

export async function retrieveCustomerOrder(token: string, id: string) {
  const { orders } = await createAuthSdk().store.order.list(
    { id, limit: 1, fields: ORDER_FIELDS },
    authorization(token),
  )
  return orders[0]
}

export interface ReturnReason { id: string; label: string; description?: string | null }
export interface ReturnShippingOption { id: string; name: string; amount?: number; calculated_price?: { calculated_amount?: number } }
export interface CreateCustomerReturnInput {
  order_id: string
  items: Array<{ id: string; quantity: number; reason_id: string; note?: string | null }>
  return_shipping: { option_id: string }
  note?: string | null
}

export async function listReturnReasons(token: string) {
  return createAuthSdk().client.fetch<{ return_reasons: ReturnReason[] }>(
    "/store/return-reasons?limit=100",
    { headers: authorization(token) },
  )
}

export async function listReturnShippingOptions(token: string, cartId: string) {
  return createAuthSdk().client.fetch<{ shipping_options: ReturnShippingOption[] }>(
    `/store/shipping-options?cart_id=${encodeURIComponent(cartId)}&is_return=true`,
    { headers: authorization(token) },
  )
}

export async function createCustomerReturn(token: string, input: CreateCustomerReturnInput) {
  return createAuthSdk().client.fetch<{ return: { id: string; status: string } }>("/store/returns", {
    method: "POST",
    body: input,
    headers: authorization(token),
  })
}

export function isUnauthorized(error: unknown) {
  return error instanceof FetchError && error.status === 401
}

export function formatOrderPrice(amount: number | null | undefined, currencyCode: string) {
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: currencyCode.toUpperCase(),
  }).format(amount || 0)
}

export function getOrderStatus(order: Pick<HttpTypes.StoreOrder, "status" | "fulfillment_status">) {
  if (order.status === "canceled") return { label: "Anulowane", tone: "muted" }
  switch (order.fulfillment_status) {
    case "delivered": return { label: "Dostarczone", tone: "success" }
    case "partially_delivered": return { label: "Częściowo dostarczone", tone: "progress" }
    case "shipped": return { label: "Wysłane", tone: "progress" }
    case "partially_shipped": return { label: "Częściowo wysłane", tone: "progress" }
    case "fulfilled": return { label: "Gotowe do wysyłki", tone: "progress" }
    case "partially_fulfilled": return { label: "W realizacji", tone: "pending" }
    case "canceled": return { label: "Anulowane", tone: "muted" }
    default: return { label: "Przyjęte do realizacji", tone: "pending" }
  }
}
