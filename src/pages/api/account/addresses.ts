import type { APIRoute } from "astro"
import type { HttpTypes } from "@medusajs/types"
import { createCustomerAddress, deleteCustomerAddress, isUnauthorized, updateCustomerAddress } from "../../../lib/auth"

function value(data: FormData, name: string) {
  return String(data.get(name) || "").trim()
}

function addressInput(data: FormData): HttpTypes.StoreCreateCustomerAddress | null {
  const input: HttpTypes.StoreCreateCustomerAddress = {
    address_name: value(data, "address_name"),
    first_name: value(data, "first_name"),
    last_name: value(data, "last_name"),
    company: value(data, "company") || null,
    phone: value(data, "phone") || null,
    address_1: value(data, "address_1"),
    address_2: value(data, "address_2") || null,
    postal_code: value(data, "postal_code"),
    city: value(data, "city"),
    province: value(data, "province") || null,
    country_code: value(data, "country_code").toLowerCase(),
    is_default_shipping: data.get("is_default_shipping") === "on",
    is_default_billing: data.get("is_default_billing") === "on",
  }

  return input.address_name && input.first_name && input.last_name && input.address_1
    && input.postal_code && input.city && /^[a-z]{2}$/.test(input.country_code || "") ? input : null
}

export const POST: APIRoute = async ({ request, session, redirect }) => {
  const token = await session?.get("customerToken")
  if (!token) return redirect("/account/login?next=/account/addresses", 303)

  const data = await request.formData()
  const intent = value(data, "intent")
  const addressId = value(data, "address_id")

  try {
    if (intent === "delete" && addressId) {
      await deleteCustomerAddress(token, addressId)
    } else {
      const input = addressInput(data)
      if (!input) return redirect("/account/addresses?error=validation", 303)
      if (intent === "update" && addressId) await updateCustomerAddress(token, addressId, input)
      else if (intent === "create") await createCustomerAddress(token, input)
      else return redirect("/account/addresses?error=validation", 303)
    }
    return redirect(`/account/addresses?success=${intent}`, 303)
  } catch (error) {
    if (isUnauthorized(error)) {
      session?.destroy()
      return redirect("/account/login?error=expired&next=/account/addresses", 303)
    }
    return redirect("/account/addresses?error=request", 303)
  }
}
