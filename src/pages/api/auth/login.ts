import type { APIRoute } from "astro"
import { loginCustomer } from "../../../lib/auth"

function safeNext(value: FormDataEntryValue | null) {
  const next = typeof value === "string" ? value : "/account"
  return next.startsWith("/") && !next.startsWith("//") ? next : "/account"
}

export const POST: APIRoute = async ({ request, session, redirect }) => {
  const data = await request.formData()
  const email = String(data.get("email") || "").trim().toLowerCase()
  const password = String(data.get("password") || "")
  const next = safeNext(data.get("next"))

  if (!email || !password) {
    return redirect(`/account/login?error=missing&next=${encodeURIComponent(next)}`, 303)
  }

  try {
    const token = await loginCustomer(email, password)
    await session?.regenerate()
    session?.set("customerToken", token)
    return redirect(next, 303)
  } catch {
    return redirect(`/account/login?error=invalid&next=${encodeURIComponent(next)}`, 303)
  }
}
