/** Debug session logging — remove after eb2bc4 investigation. */
import { appendFileSync } from "node:fs";
import { join } from "node:path";
const DEBUG_LOG = join(process.cwd(), ".cursor", "debug-eb2bc4.log");
export function debugLog(location, message, data, hypothesisId) {
    const payload = {
        sessionId: "eb2bc4",
        location,
        message,
        data,
        hypothesisId,
        timestamp: Date.now(),
    };
    // #region agent log
    try {
        appendFileSync(DEBUG_LOG, `${JSON.stringify(payload)}\n`, "utf8");
    }
    catch {
        /* ignore */
    }
    fetch("http://127.0.0.1:7430/ingest/728b515c-a7d6-4fc0-a687-4945c709eeff", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Debug-Session-Id": "eb2bc4",
        },
        body: JSON.stringify(payload),
    }).catch(() => { });
    // #endregion
}
