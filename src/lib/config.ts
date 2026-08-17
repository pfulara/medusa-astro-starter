const DEFAULT_BACKEND_URL = "http://localhost:9000"

function runtimeEnv(name: string) {
  return typeof process !== "undefined" ? process.env[name] : undefined
}

export function getMedusaConfig() {
  const backendUrl = (
    runtimeEnv("BACKEND_URL") ||
    runtimeEnv("PUBLIC_MEDUSA_BACKEND_URL") ||
    import.meta.env.PUBLIC_MEDUSA_BACKEND_URL ||
    DEFAULT_BACKEND_URL
  ).replace(/\/$/, "")

  const publishableKey =
    runtimeEnv("MEDUSA_PUBLISHABLE_KEY") ||
    runtimeEnv("PUBLISHABLE_KEY") ||
    runtimeEnv("PUBLIC_MEDUSA_PUBLISHABLE_KEY") ||
    import.meta.env.MEDUSA_PUBLISHABLE_KEY ||
    import.meta.env.PUBLIC_MEDUSA_PUBLISHABLE_KEY

  return { backendUrl, publishableKey }
}
