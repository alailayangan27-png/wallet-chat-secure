import { redis } from "../../../lib/db";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address");

  const data = await redis.lrange(`chat:${address}`, 0, 50);

  return Response.json(data.map(JSON.parse));
}
