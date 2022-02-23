export * from "fs/promises";
export { basename, extname, join, relative } from "path";

export * from "child_process";

export { default as leasot, isExtensionSupported as leasotExtSupported } from "leasot";

export { default as globFs } from "glob-fs";

import { createHash } from "crypto";

export function hash(str: string) {
  return createHash("sha1").update(str).digest("hex").toString();
}

export * from "@aws-sdk/client-s3";
export * from "@aws-sdk/lib-storage";
export * from "@aws-sdk/middleware-apply-body-checksum";
