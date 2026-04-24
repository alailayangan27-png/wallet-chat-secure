import { redis } from "../../../lib/db";

export async function POST(req) {
  const { address, publicKey } = await req.json();

  await redis.set(`pub:${address}`, publicKey);

  return Response.json({ ok: true });
}
