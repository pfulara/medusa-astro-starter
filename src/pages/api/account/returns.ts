import type { APIRoute } from "astro"
import type { HttpTypes } from "@medusajs/types"
import { createCustomerReturn, isUnauthorized, listReturnReasons, listReturnShippingOptions, retrieveCustomerOrder } from "../../../lib/auth"

type ReturnableOrder = HttpTypes.StoreOrder & { cart?: { id: string } | null }

const field = (data: FormData, name: string) => String(data.get(name) || "").trim()

export const POST: APIRoute = async ({ request, session, redirect }) => {
  const token = await session?.get("customerToken")
  if (!token) return redirect("/account/login?next=/account/returns", 303)

  const data = await request.formData()
  const orderId = field(data, "order_id")
  const optionId = field(data, "return_shipping_option_id")
  const selectedItemIds = data.getAll("item_id").map(String)
  if (!orderId || !optionId || !selectedItemIds.length) return redirect("/account/returns?error=validation", 303)

  try {
    const order = await retrieveCustomerOrder(token, orderId) as ReturnableOrder | undefined
    if (!order || order.status === "canceled") return redirect("/account/returns?error=order", 303)

    const cartId = order.cart?.id
    if (!cartId) return redirect("/account/returns?error=shipping", 303)
    const [{ return_reasons: reasons }, { shipping_options: options }] = await Promise.all([
      listReturnReasons(token),
      listReturnShippingOptions(token, cartId),
    ])
    if (!options.some((option) => option.id === optionId)) return redirect("/account/returns?error=shipping", 303)

    const items = selectedItemIds.flatMap((itemId) => {
      const item = order.items?.find((candidate) => candidate.id === itemId)
      const quantity = Number(field(data, `quantity_${itemId}`))
      const reasonId = field(data, `reason_${itemId}`)
      const detail = item?.detail
      const available = Math.max(0, (item?.quantity || 0) - (detail?.return_requested_quantity || 0))
      if (!item || !Number.isInteger(quantity) || quantity < 1 || quantity > available || !reasons.some((reason) => reason.id === reasonId)) return []
      return [{ id: itemId, quantity, reason_id: reasonId, note: field(data, `note_${itemId}`) || null }]
    })
    if (items.length !== selectedItemIds.length) return redirect("/account/returns?error=validation", 303)

    const result = await createCustomerReturn(token, {
      order_id: orderId,
      items,
      return_shipping: { option_id: optionId },
      note: field(data, "note") || null,
    })
    return redirect(`/account/returns?success=${encodeURIComponent(result.return.id)}`, 303)
  } catch (error) {
    if (isUnauthorized(error)) {
      session?.destroy()
      return redirect("/account/login?error=expired&next=/account/returns", 303)
    }
    return redirect("/account/returns?error=request", 303)
  }
}
