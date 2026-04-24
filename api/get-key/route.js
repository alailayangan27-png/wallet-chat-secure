import { redis } from "../../../lib/db";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address");

  const publicKey = await redis.get(`pub:${address}`);
  return Response.json({ publicKey });
}
