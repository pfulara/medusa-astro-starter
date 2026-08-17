import type { APIRoute } from "astro"
import { registerCustomer } from "../../../lib/auth"

function safeNext(value: FormDataEntryValue | null) {
  const next = typeof value === "string" ? value : "/account"
  return next.startsWith("/") && !next.startsWith("//") ? next : "/account"
}

export const POST: APIRoute = async ({ request, session, redirect }) => {
  const data = await request.formData()
  const email = String(data.get("email") || "").trim().toLowerCase()
  const password = String(data.get("password") || "")
  const firstName = String(data.get("first_name") || "").trim()
  const lastName = String(data.get("last_name") || "").trim()
  const next = safeNext(data.get("next"))

  if (!email || password.length < 8 || !firstName || !lastName) {
    return redirect(`/account/register?error=validation&next=${encodeURIComponent(next)}`, 303)
  }

  try {
    const token = await registerCustomer({ email, password, first_name: firstName, last_name: lastName })
    await session?.regenerate()
    session?.set("customerToken", token)
    return redirect(next, 303)
  } catch {
    return redirect(`/account/register?error=exists&next=${encodeURIComponent(next)}`, 303)
  }
}
