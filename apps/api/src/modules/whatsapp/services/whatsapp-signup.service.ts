import { Inject, Injectable } from "@nestjs/common";
import {
  WHATSAPP_TOKEN_VAULT,
  WHATSAPP_SIGNUP_STATE,
  WHATSAPP_SIGNUP_GATEWAY,
  WHATSAPP_GATEWAY,
  WHATSAPP_REPOSITORY,
  type IWhatsappGateway,
  type IWhatsappRepository,
  type IWhatsappSignupGateway,
  type IWhatsappSignupState,
  type IWhatsappTokenVault,
} from "../contracts/whatsapp.ports.js";
import { WhatsappError, type WhatsappActor, type WhatsappSignupInput } from "../models/whatsapp.js";

@Injectable()
export class WhatsappSignupService {
  constructor(
    @Inject(WHATSAPP_REPOSITORY) private readonly repository: IWhatsappRepository,
    @Inject(WHATSAPP_GATEWAY) private readonly gateway: IWhatsappGateway,
    @Inject(WHATSAPP_SIGNUP_GATEWAY) private readonly signup: IWhatsappSignupGateway,
    @Inject(WHATSAPP_SIGNUP_STATE) private readonly state: IWhatsappSignupState,
    @Inject(WHATSAPP_TOKEN_VAULT) private readonly vault: IWhatsappTokenVault,
  ) {}

  private async authorize(actor: WhatsappActor, businessId: string) {
    if (actor.businessId !== businessId) throw new WhatsappError("WHATSAPP_FORBIDDEN");
    await this.repository.authorize(actor);
  }

  async configuration(actor: WhatsappActor, businessId: string) {
    await this.authorize(actor, businessId);
    return this.state.configuration(actor);
  }

  async complete(actor: WhatsappActor, businessId: string, input: WhatsappSignupInput) {
    await this.authorize(actor, businessId);
    await this.state.verify(actor, input.state);
    await this.repository.assertSignupPhoneAvailable(actor, input.phoneNumberId);
    // Meta's code is single-use and short lived. Never retry an exchange automatically.
    const accessToken = await this.signup.exchangeCode(input.code);
    const encryptedAccessToken = this.vault.encrypt(accessToken, businessId, input.phoneNumberId);
    await this.signup.verifyAssets(input.wabaId, input.phoneNumberId, accessToken);
    const phone = await this.gateway.verifyPhone(input.phoneNumberId, accessToken);
    await this.repository.assertSignupPhoneAvailable(actor, input.phoneNumberId);
    await this.signup.subscribe(input.wabaId, accessToken);
    await this.signup.register(input.phoneNumberId, accessToken, input.pin);
    // Reauthorizes in the transaction. External side effects cannot be rolled back with PostgreSQL.
    return this.repository.saveConnection(actor, { ...phone, encryptedAccessToken }, true);
  }
}
