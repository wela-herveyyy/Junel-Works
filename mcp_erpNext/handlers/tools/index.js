import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import { getActiveToolDefinitions } from "./filter.js";
import { handleToolCall } from "./handlers.js";
export function registerToolHandlers(server, erpnext, profile, doctypeCache) {
    server.setRequestHandler(ListToolsRequestSchema, async () => ({
        tools: getActiveToolDefinitions().map((tool) => ({ ...tool })),
    }));
    server.setRequestHandler(CallToolRequestSchema, async (request) => handleToolCall(request.params.name, request.params.arguments, erpnext, profile, doctypeCache));
}
