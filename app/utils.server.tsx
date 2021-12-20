export * from "fs/promises";
export { readdir, readFile, stat } from "fs/promises";
export { basename, extname, join, relative } from "path";
export {
  default as leasot,
  isExtensionSupported as leasotExtSupported,
} from "leasot";
import { createHash } from "crypto";

export function hash(str: string) {
  return createHash("sha1").update(str).digest("hex").toString();
}
