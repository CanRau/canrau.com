export * from "node:fs/promises";
export { basename, extname, join, relative } from "node:path";

export * from "child_process";

export { default as globFs } from "glob-fs";

import { createHash } from "node:crypto";

export function hash(str: string) {
  return createHash("sha1").update(str).digest("hex").toString();
}

export * from "@aws-sdk/client-s3";
export * from "@aws-sdk/lib-storage";
export * from "@aws-sdk/middleware-apply-body-checksum";
