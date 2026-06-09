import { jsonResponse } from "@/lib/api-response";
import { runMonitorCheck } from "@/lib/monitoring/alerts";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sendWebhook = searchParams.get("webhook") !== "false";
    const result = await runMonitorCheck(sendWebhook);
    return jsonResponse(result);
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Monitor error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
