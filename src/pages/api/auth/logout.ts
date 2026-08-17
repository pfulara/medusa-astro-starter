import type { APIRoute } from "astro"

export const POST: APIRoute = async ({ session, redirect }) => {
  session?.destroy()
  return redirect("/account/login", 303)
}
