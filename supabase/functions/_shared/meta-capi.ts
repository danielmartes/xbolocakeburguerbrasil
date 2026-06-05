export async function trackMetaConversion(eventName: string, userData: any, customData: any = {}) {
  // Meta Pixel removed
  console.log(`Tracking disabled for ${eventName}`);
  return { skipped: true };
}