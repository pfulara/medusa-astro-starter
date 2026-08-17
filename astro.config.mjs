// @ts-check
import { defineConfig, sessionDrivers } from "astro/config"
import node from "@astrojs/node"

// https://astro.build/config
export default defineConfig({
  output: "server",
  adapter: node({ mode: "standalone" }),
  image: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "medusa-public-images.s3.eu-west-1.amazonaws.com",
        pathname: "/**",
      },
    ],
  },
  session: {
    driver: sessionDrivers.fs({ base: ".astro/session" }),
    ttl: 60 * 60 * 24 * 30,
    cookie: {
      name: "atelier-session",
      sameSite: "lax",
      secure: import.meta.env.PROD,
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    },
  },
  server: {
    port: 8000,
  },
})
