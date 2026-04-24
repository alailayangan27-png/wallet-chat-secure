import { redis } from "../../../lib/db";

export async function POST(req) {
  const { address } = await req.json();

  let user = await redis.get(address);

  if (!user) {
    user = { wallet: address, balance: 10 };
    await redis.set(address, user);
  }

  return Response.json(user);
}
