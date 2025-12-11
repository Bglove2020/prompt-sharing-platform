import COS from "cos-nodejs-sdk-v5";

const {
  COS_SECRET_ID,
  COS_SECRET_KEY,
  COS_BUCKET,
  COS_REGION,
  COS_PUBLIC_DOMAIN,
} = process.env;

const requiredEnv = [
  "COS_SECRET_ID",
  "COS_SECRET_KEY",
  "COS_BUCKET",
  "COS_REGION",
] as const;

function ensureEnv() {
  const missing = requiredEnv.filter((k) => !process.env[k]);
  if (missing.length) {
    throw new Error(`COS env missing: ${missing.join(", ")}`);
  }
}

let cosClient: COS | null = null;

export function getCosClient() {
  ensureEnv();
  if (!cosClient) {
    cosClient = new COS({
      SecretId: COS_SECRET_ID!,
      SecretKey: COS_SECRET_KEY!,
    });
  }
  return cosClient;
}

export function buildAvatarObjectKey(userId: string, filename: string) {
  const ext = filename.includes(".")
    ? filename.substring(filename.lastIndexOf("."))
    : "";
  const safeExt = ext.slice(0, 10); // 简单限制长度
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  const prefix = process.env.COS_AVATAR_PREFIX || "avatars";
  return `${prefix}/${userId}/${timestamp}-${random}${safeExt}`;
}

export function getPublicCosUrl(objectKey: string) {
  ensureEnv();
  const base =
    COS_PUBLIC_DOMAIN ||
    `https://${COS_BUCKET}.cos.${COS_REGION}.myqcloud.com`;
  return `${base.replace(/\/$/, "")}/${objectKey.replace(/^\//, "")}`;
}

