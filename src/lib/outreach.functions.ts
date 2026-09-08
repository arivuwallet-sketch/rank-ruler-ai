import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  endpoint: z.string().url(),
  token: z.string().max(500).optional(),
  payload: z.record(z.string(), z.unknown()),
});

export type DeliveryResult = { ok: boolean; status: number; message: string };

/**
 * Posts an outreach email or a captured lead to a user-supplied endpoint
 * (SendGrid, a Gmail relay, a HubSpot/Salesforce webhook, or any Zapier hook).
 * No credentials are stored: the token is used for this single request only.
 */
export const deliverPayload = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(async ({ data }): Promise<DeliveryResult> => {
    const headers: Record<string, string> = { "content-type": "application/json" };
    if (data.token) headers["authorization"] = `Bearer ${data.token}`;
    try {
      const res = await fetch(data.endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(data.payload),
      });
      const text = (await res.text()).slice(0, 300);
      return {
        ok: res.ok,
        status: res.status,
        message: res.ok ? "Delivered" : text || `Rejected with status ${res.status}`,
      };
    } catch (err) {
      return {
        ok: false,
        status: 0,
        message: err instanceof Error ? err.message : "Could not reach the endpoint",
      };
    }
  });
