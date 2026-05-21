import type { Context, Next } from "hono";
import type { Env } from "./types";

export async function metricsMiddleware(_c: Context<{ Bindings: Env }>, next: Next) {
  await next();
}
