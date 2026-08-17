import type { APIRoute } from "astro"
import { transferCartToCustomer } from "../../../lib/auth"

export const POST: APIRoute = async ({ request, session }) => {
  const token = await session?.get("customerToken")
  if (!token) return new Response(null, { status: 401 })

  const data = await request.formData()
  const cartId = String(data.get("cart_id") || "")
  if (!cartId.startsWith("cart_")) {
    return new Response("Nieprawidłowy identyfikator koszyka.", { status: 400 })
  }

  try {
    await transferCartToCustomer(token, cartId)
    return new Response(null, { status: 204 })
  } catch {
    return new Response("Nie udało się przypisać koszyka do konta.", { status: 400 })
  }
}
