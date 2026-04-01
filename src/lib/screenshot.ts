import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const TENANT_ID = "00000000-0000-0000-0000-000000000001";

interface ScreenshotResult {
  url: string;
  label: string;
  screenshotPath: string | null;
  screenshotUrl: string | null;
  error: string | null;
}

/**
 * Take a screenshot using free APIs (no paid service required).
 * Tries multiple free services in order:
 * 1. Google PageSpeed (free, reliable, no key needed)
 * 2. Screenshot Machine free tier
 * 3. Microlink (free tier)
 */
async function captureScreenshot(url: string): Promise<Buffer | null> {
  // Method 1: Google PageSpeed Insights (free, no API key)
  // Returns a screenshot as part of the Lighthouse audit
  try {
    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&category=performance&strategy=desktop`;
    const res = await fetch(apiUrl, { signal: AbortSignal.timeout(20000) });
    if (res.ok) {
      const data = await res.json();
      const screenshot = data?.lighthouseResult?.audits?.["final-screenshot"]?.details?.data;
      if (screenshot) {
        // It's a data URL: data:image/jpeg;base64,...
        const base64 = screenshot.split(",")[1];
        if (base64) return Buffer.from(base64, "base64");
      }
    }
  } catch {
    // Try next method
  }

  // Method 2: Microlink screenshot API (free tier: 50/day)
  try {
    const apiUrl = `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false&embed=screenshot.url`;
    const res = await fetch(apiUrl, { signal: AbortSignal.timeout(15000) });
    if (res.ok) {
      const data = await res.json();
      const screenshotUrl = data?.data?.screenshot?.url;
      if (screenshotUrl) {
        const imgRes = await fetch(screenshotUrl, { signal: AbortSignal.timeout(10000) });
        if (imgRes.ok) {
          const arrayBuffer = await imgRes.arrayBuffer();
          return Buffer.from(arrayBuffer);
        }
      }
    }
  } catch {
    // Try next method
  }

  // Method 3: thum.io (free, no key)
  try {
    const thumbUrl = `https://image.thum.io/get/width/1280/crop/800/${url}`;
    const res = await fetch(thumbUrl, { signal: AbortSignal.timeout(15000) });
    if (res.ok && res.headers.get("content-type")?.includes("image")) {
      const arrayBuffer = await res.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }
  } catch {
    // All methods failed
  }

  return null;
}

/**
 * Take a screenshot of a URL and upload to Supabase Storage.
 */
export async function takeScreenshot(
  url: string,
  entityId: string,
  label: string,
): Promise<ScreenshotResult> {
  try {
    const buffer = await captureScreenshot(url);

    if (!buffer) {
      return { url, label, screenshotPath: null, screenshotUrl: null, error: "Capture failed" };
    }

    // Upload to Supabase Storage
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const sanitizedLabel = label.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 50);
    const date = new Date().toISOString().slice(0, 10);
    const storagePath = `${TENANT_ID}/${entityId}/screenshots/${date}_${sanitizedLabel}.png`;

    const { error: uploadErr } = await supabase.storage
      .from("documents")
      .upload(storagePath, buffer, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadErr) {
      return { url, label, screenshotPath: null, screenshotUrl: null, error: `Upload: ${uploadErr.message}` };
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage.from("documents").getPublicUrl(storagePath);

    return {
      url,
      label,
      screenshotPath: storagePath,
      screenshotUrl: publicUrlData.publicUrl,
      error: null,
    };
  } catch (err) {
    return {
      url,
      label,
      screenshotPath: null,
      screenshotUrl: null,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Take screenshots of multiple URLs (3 at a time to avoid rate limits)
 */
export async function takeScreenshots(
  urls: { url: string; label: string }[],
  entityId: string,
): Promise<ScreenshotResult[]> {
  const results: ScreenshotResult[] = [];
  const batchSize = 3;

  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((u) => takeScreenshot(u.url, entityId, u.label))
    );
    results.push(...batchResults);
  }

  return results;
}
