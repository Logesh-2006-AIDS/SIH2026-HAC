import { NextRequest, NextResponse } from "next/server";
import { getMock } from "@/lib/mockStore";

const backendBaseUrl = process.env.BACKEND_API_URL?.replace(/\/$/, "");

async function proxyToBackend(request: NextRequest, path: string) {
  if (!backendBaseUrl) return null;
  const headers = new Headers();
  const authorization = request.headers.get("authorization");
  const contentType = request.headers.get("content-type");
  if (authorization) headers.set("authorization", authorization);
  if (contentType) headers.set("content-type", contentType);

  try {
    const response = await fetch(`${backendBaseUrl}${path}${request.nextUrl.search}`, {
      method: request.method,
      headers,
      body: request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer(),
      cache: "no-store",
    });
    const body = await response.arrayBuffer();
    return new NextResponse(body, {
      status: response.status,
      headers: { "content-type": response.headers.get("content-type") ?? "application/json" },
    });
  } catch {
    return NextResponse.json({ detail: "The production API is temporarily unavailable." }, { status: 503 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
){
  void request;
  const { slug } = await params;
  const path = `/api/v1/${slug.join("/")}`;
  const proxied = await proxyToBackend(request, path);
  if (proxied) return proxied;
  const mock = getMock(path);

  if (path === "/api/v1/health") {
    return NextResponse.json(
      mock || {
        status: "UP",
        version: "2.1.0",
        services: {
          api: { status: "UP", details: "FastAPI Gateway v2.1" },
          postgresql: { status: "UP", details: "Evidence DB Synced" },
          memgraph: { status: "UP", details: "Knowledge Graph Connected" },
          data_mode: { details: "DEMO / OPERATIONAL" }
        }
      }
    );
  }

  if (mock !== null) {
    return NextResponse.json({ success: true, data: mock });
  }

  return NextResponse.json({ success: true, data: {} });
}

export async function POST(
  request: NextRequest,
  { params: _params }: { params: Promise<{ slug: string[] }> }
){
  const { slug } = await _params;
  const path = `/api/v1/${slug.join("/")}`;
  const proxied = await proxyToBackend(request, path);
  if (proxied) return proxied;
  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    // empty
  }

  const created = {
    id: Date.now(),
    lead_id: `LEAD-${Date.now().toString().slice(-4)}`,
    status: "PENDING",
    created_at: new Date().toISOString(),
    ...body,
  };

  return NextResponse.json({ success: true, data: created });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> },
) {
  const { slug } = await params;
  const path = `/api/v1/${slug.join("/")}`;
  const proxied = await proxyToBackend(request, path);
  if (proxied) return proxied;
  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    // empty
  }
  return NextResponse.json({ success: true, data: body });
}
