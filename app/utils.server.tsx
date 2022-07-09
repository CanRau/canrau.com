import { createHash, type BinaryToTextEncoding, type BinaryLike } from "node:crypto";

export * from "node:fs/promises";
export { basename, extname, join, relative } from "node:path";
export * from "child_process";

export function hash(str: string) {
  return createHash("sha1").update(str).digest("hex");
}

/**
 *
 * @param data input BinaryLike
 * @param encoding defaults to base64url
 * @returns string truncated to first 10 charaters
 *
 * @description inspired by [sindresorhus/rev-hash](https://github.com/sindresorhus/rev-hash)
 */
export function revHash(data: BinaryLike, encoding: BinaryToTextEncoding = "base64url") {
  return createHash("sha1").update(data).digest(encoding).slice(0, 10);
}

export * from "@aws-sdk/client-s3";
export * as libStorage from "@aws-sdk/lib-storage";
export * from "@aws-sdk/middleware-apply-body-checksum";
