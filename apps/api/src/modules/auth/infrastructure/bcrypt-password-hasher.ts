import { randomBytes } from "node:crypto";
import bcrypt from "bcrypt";
import type { PasswordHasher } from "../application/auth.ports.js";

export class BcryptPasswordHasher implements PasswordHasher {
  private readonly dummyHash: Promise<string>;

  constructor(private readonly rounds: number) {
    this.dummyHash = bcrypt.hash(randomBytes(32).toString("hex"), rounds);
  }

  hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.rounds);
  }

  async verify(password: string, hash?: string): Promise<boolean> {
    return bcrypt.compare(password, hash ?? (await this.dummyHash));
  }

  async ready(): Promise<void> {
    await this.dummyHash;
  }
}
