import { NextRequest, NextResponse } from "next/server";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { buildMcpServer } from "@/mcp/server";
import { resolveApiToken } from "@/lib/apiTokens";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

async function authenticate(req: NextRequest): Promise<string | null> {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice("Bearer ".length).trim();
  return resolveApiToken(token);
}

export async function POST(req: NextRequest) {
  const userId = await authenticate(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized — missing or invalid bearer token" }, { status: 401 });
  }

  // Stateless per spec — a fresh server+transport per request, nothing
  // held across invocations. Appropriate for serverless, where a given
  // function instance handling the next request isn't guaranteed to be
  // the same one that handled this one.
  const server = buildMcpServer(userId);
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });

  const body = await req.json();

  return new Promise<NextResponse>((resolve) => {
    const chunks: Uint8Array[] = [];
    const fakeRes = {
      writeHead: () => fakeRes,
      write: (chunk: string) => {
        chunks.push(new TextEncoder().encode(chunk));
        return true;
      },
      end: () => {
        resolve(
          new NextResponse(Buffer.concat(chunks.map((c) => Buffer.from(c))), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        );
      },
      setHeader: () => fakeRes,
    };

    server.connect(transport).then(() => {
      // @ts-expect-error — adapting Node's response interface to Next's
      // Request/Response model; the SDK's HTTP transport expects a
      // Node-style ServerResponse, which Next's route handlers don't
      // natively provide.
      transport.handleRequest(req as any, fakeRes, body);
    });
  });
}