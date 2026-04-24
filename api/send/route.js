import { redis } from "../../../lib/db";

export async function POST(req) {
  const { from, to, payload } = await req.json();

  const msg = {
    from,
    to,
    payload,
    time: Date.now()
  };

  await redis.lpush(`chat:${to}`, JSON.stringify(msg));

  return Response.json({ ok: true });
}
