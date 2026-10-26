// Server-only storage: Upstash Redis when deployed (Vercel), plain files in /data on a laptop.
import fs from "fs/promises";
import path from "path";
import { Redis } from "@upstash/redis";

const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = url && token ? new Redis({ url, token, automaticDeserialization: false }) : null;

const local = (key: string) => path.join(process.cwd(), "data", key);

export async function readText(key: string) {
  if (redis) return (await redis.get<string>(key)) ?? undefined;
  return fs.readFile(local(key), "utf8").catch(() => undefined);
}

export async function writeText(key: string, value: string) {
  if (redis) return void (await redis.set(key, value));
  await fs.mkdir(path.dirname(local(key)), { recursive: true });
  await fs.writeFile(local(key), value);
}

export async function readBytes(key: string) {
  if (redis) {
    const b64 = await redis.get<string>(key);
    if (!b64) throw new Error("File not found");
    return Buffer.from(b64, "base64");
  }
  return fs.readFile(local(key));
}

export async function writeBytes(key: string, value: Buffer) {
  if (redis) return void (await redis.set(key, value.toString("base64")));
  await fs.mkdir(path.dirname(local(key)), { recursive: true });
  await fs.writeFile(local(key), value);
}
