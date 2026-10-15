import { HOUR, RateLimiter } from "@convex-dev/rate-limiter";
import { ConvexError, v } from "convex/values";
import { components } from "./_generated/api";
import { internalMutation } from "./_generated/server";

export const SCANS_PER_DEVICE_PER_HOUR = 40;
export const SCANS_GLOBAL_PER_HOUR = 400;

export const rateLimiter = new RateLimiter(components.rateLimiter, {
  // Token buckets refill continuously, so a surveyor who burns through the
  // allowance gets a scan back every ~90 seconds rather than waiting a full hour.
  scanPerDevice: {
    kind: "token bucket",
    rate: SCANS_PER_DEVICE_PER_HOUR,
    period: HOUR,
  },
  scanGlobal: {
    kind: "token bucket",
    rate: SCANS_GLOBAL_PER_HOUR,
    period: HOUR,
  },
});

function minutesUntil(retryAfterMs: number | undefined): string {
  const minutes = Math.max(1, Math.ceil((retryAfterMs ?? 60_000) / 60_000));
  return minutes === 1 ? "about a minute" : `about ${minutes} minutes`;
}

/**
 * Consumes one scan from both the per-device and the global allowance.
 * Runs as a single transaction: if the global limit rejects the scan, the
 * per-device token taken a moment earlier is rolled back with it.
 */
export const consumeScan = internalMutation({
  args: { deviceId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const device = await rateLimiter.limit(ctx, "scanPerDevice", {
      key: args.deviceId,
    });
    if (!device.ok) {
      throw new ConvexError(
        `You've reached the limit of ${SCANS_PER_DEVICE_PER_HOUR} AI scans per hour on this device. ` +
          `Please try again in ${minutesUntil(device.retryAfter)}.`,
      );
    }

    const global = await rateLimiter.limit(ctx, "scanGlobal");
    if (!global.ok) {
      throw new ConvexError(
        `AI scanning is very busy right now. Please try again in ${minutesUntil(global.retryAfter)}.`,
      );
    }
    return null;
  },
});
