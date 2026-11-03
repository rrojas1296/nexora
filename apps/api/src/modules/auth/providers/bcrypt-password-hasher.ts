import { Inject, Injectable, type OnModuleInit } from "@nestjs/common";
import { AUTH_SETTINGS, type IAuthSettings } from "../models/auth.js";
import { randomBytes } from "node:crypto";
import type { IPasswordHasher } from "../contracts/auth.ports.js";
import bcrypt from "bcrypt";

@Injectable()
export class BcryptPasswordHasher implements IPasswordHasher, OnModuleInit {
  private readonly dummyHash: Promise<string>;
  private readonly rounds: number;

  constructor(@Inject(AUTH_SETTINGS) settings: IAuthSettings) {
    this.rounds = settings.bcryptRounds;
    this.dummyHash = bcrypt.hash(randomBytes(32).toString("hex"), this.rounds);
  }

  async onModuleInit(): Promise<void> {
    await this.ready();
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
