import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

/**
 * Servidor MCP para interactuar con Google Stitch.
 */
const server = new Server(
  {
    name: "stitch-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const STITCH_API_KEY = process.env.STITCH_API_KEY;
const STITCH_ENDPOINT = "https://stitch.googleapis.com/mcp";

/**
 * Listar herramientas disponibles.
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_project_details",
        description: "Obtiene los detalles de un proyecto de Stitch, incluyendo pantallas y tokens de diseño.",
        inputSchema: {
          type: "object",
          properties: {
            projectId: {
              type: "string",
              description: "El ID del proyecto de Stitch.",
            },
          },
          required: ["projectId"],
        },
      },
    ],
  };
});

/**
 * Manejar llamadas a herramientas.
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "get_project_details") {
    const { projectId } = request.params.arguments as { projectId: string };

    try {
      // Simulación de llamada a la API de Stitch (usando JSON-RPC como indica la documentación)
      const response = await fetch(STITCH_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": STITCH_API_KEY || "",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "get_project",
          params: { projectId },
          id: 1,
        }),
      });

      const data = await response.json();

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Error al conectar con Stitch: ${error.message}`,
          },
        ],
      };
    }
  }

  throw new Error(`Herramienta no encontrada: ${request.params.name}`);
});

/**
 * Iniciar el servidor.
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Stitch MCP Server iniciado correctamente.");
}

main().catch((error) => {
  console.error("Error fatal en el servidor MCP:", error);
  process.exit(1);
});
