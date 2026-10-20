import { randomBytes } from "node:crypto";
import { appendFile, chmod, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { parse } from "dotenv";

const path = fileURLToPath(new URL("../.env", import.meta.url));
const source = await readFile(path, "utf8");
const environment = parse(source);
const keys = ["AUTH_ACCESS_SECRET", "AUTH_REFRESH_SECRET", "AUTH_CSRF_SECRET"];
const missing = keys.filter((key) => !environment[key]);

if (missing.length) {
  const entries = missing.map((key) => `${key}=${randomBytes(64).toString("base64url")}`);
  await appendFile(
    path,
    `\n# Independent authentication secrets. Never commit this file.\n${entries.join("\n")}\n`,
  );
}
await chmod(path, 0o600);
console.log(
  `Authentication configuration ready. Added ${missing.length} secret(s); values are not displayed. Existing values were preserved.`,
);
