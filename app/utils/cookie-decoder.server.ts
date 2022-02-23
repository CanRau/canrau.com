import crypto from "crypto";

const block_size_bits = 128;
const block_size_bytes = block_size_bits / 8; // 16 bytes

// This is the reversal (decode) of the gorilla toolkit securecookie encode.
// https://github.com/gorilla/securecookie/blob/master/securecookie.go
export class CookieDecoder {
  cookieName: string;
  hashKey: string;
  blockKey: string;

  constructor(cookieName: string, hashKey: string, blockKey: string) {
    this.cookieName = cookieName;
    this.hashKey = hashKey;
    this.blockKey = blockKey;
  }

  decodeToJson(cookieContent: string) {
    const decoded = this.decode(cookieContent);
    return JSON.parse(decoded);
  }

  decode(cookieContent: string) {
    // Step 1: Decode base64
    const decodedContent = Buffer.from(cookieContent, "base64");

    const parts = this.splitParts(decodedContent.toString());
    const date = parts[0];
    const encryptedValue = parts[1];
    const mac = parts[2];

    // Step 2: Verify MAC. Decoded content is "date|value|MAC", but MAC content is "name|date|value"
    if (!this.verifyMac(date ?? "", encryptedValue ?? "", mac as unknown as crypto.Hmac)) {
      throw "Cookie HMAC verification failed";
    }

    // Step 3: Decrypt the cookie and return
    const decryptedCookie = this.decryptContent(encryptedValue ?? "");
    return decryptedCookie;
  }

  // We avoid using String.slice because we want to keep the original Buffer unmodified throughout
  // the entire verify/decrypt process. It would be nice to just slice along the "|", but it's so much
  // easier to just work with the untranslated Buffer objects in future crypto functions
  splitParts(decodedContent: string) {
    let start = 0;
    let end = decodedContent.indexOf("|");

    if (end == -1) {
      throw 'Invalid cookie format, cannot find "date|value|MAC" structure';
    }

    const date = decodedContent.slice(start, end);

    start = end + 1;
    end = decodedContent.indexOf("|", start);

    if (end == -1) {
      throw 'Invalid cookie format, cannot find "date|value|MAC" structure';
    }

    const value = decodedContent.slice(start, end);
    const mac = decodedContent.slice(end + 1);

    return [date, value, mac];
  }

  verifyMac(date: string, encryptedValue: string, receivedMac: crypto.Hmac) {
    const macContent = Buffer.from(`${this.cookieName}|${date}|${encryptedValue}`, "utf8");
    const computedMac = crypto.createHmac("sha256", this.hashKey).update(macContent).digest();

    return receivedMac.equals(computedMac);
  }

  decryptContent(encryptedValue: Buffer) {
    // Be very careful here. If you get any of this encoding conversion wrong, nothing will decrypt correctly.
    const b = Buffer.from(encryptedValue.toString("utf-8"), "base64");

    const iv = b.slice(0, block_size_bytes);
    const cipherText = b.slice(block_size_bytes);

    // !!! WARNING !!! - The AES-256-CTR cipher might not be part of your OpenSSL library. It's fairly new, so make sure
    // you have it installed!
    const decipher = crypto.createDecipheriv("aes-256-ctr", this.blockKey, iv);
    let clearText = decipher.update(cipherText);
    clearText += decipher.final();

    return clearText.toString("utf8");
  }
}
