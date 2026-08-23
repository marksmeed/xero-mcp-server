import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { CreateTools } from "./create/index.js";
import { ListTools } from "./list/index.js";
import { UpdateTools } from "./update/index.js";
import { getPayrollTools } from "./payroll/index.js";
import { ToolList } from "../types/tool-list.js";

const register = (server: McpServer, tools: ToolList) =>
  tools
    .map((tool) => tool())
    .forEach((tool) =>
      server.tool(tool.name, tool.description, tool.schema, tool.handler),
    );

/**
 * Register every tool on the server.
 *
 * The accounting tools are the same for every organisation. The payroll tools
 * are not - UK, NZ and AU expose different APIs - so which set is registered
 * depends on the organisation's payroll region, resolved at startup.
 */
export async function ToolFactory(server: McpServer) {
  register(server, CreateTools);
  register(server, ListTools);
  register(server, UpdateTools);
  register(server, await getPayrollTools());
}
