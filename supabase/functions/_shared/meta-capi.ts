import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const PIXEL_ID = Deno.env.get("META_PIXEL_ID") || "971652248979019";
const ACCESS_TOKEN = Deno.env.get("META_ACCESS_TOKEN");

export async function trackMetaConversion(eventName: string, userData: any, customData: any = {}) {
  if (!ACCESS_TOKEN) {
    console.warn("META_ACCESS_TOKEN not set, skipping conversion tracking");
    return;
  }

  const payload = {
    data: [
      {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        action_source: "website",
        user_data: {
          em: userData.email ? [await hashData(userData.email)] : [],
          ph: userData.phone ? [await hashData(userData.phone)] : [],
          fn: userData.name ? [await hashData(userData.name.split(" ")[0])] : [],
          ln: userData.name && userData.name.split(" ").length > 1 ? [await hashData(userData.name.split(" ").pop())] : [],
          client_ip_address: userData.ip,
          client_user_agent: userData.userAgent,
        },
        custom_data: customData,
      },
    ],
  };

  try {
    const res = await fetch(`https://graph.facebook.com/v17.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await res.json();
    console.log(`Meta CAPI result for ${eventName}:`, result);
    return result;
  } catch (error) {
    console.error(`Meta CAPI error for ${eventName}:`, error);
  }
}

async function hashData(data: string) {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data.trim().toLowerCase());
  const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}