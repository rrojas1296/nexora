import { WhatsappError, type WhatsappActor, type WhatsappSignupInput } from "../domain/whatsapp.js";
import type {
  WhatsappGateway,
  WhatsappRepository,
  WhatsappSignupGateway,
  WhatsappSignupState,
  WhatsappTokenVault,
} from "./whatsapp.ports.js";

export class WhatsappSignupService {
  constructor(
    private readonly repository: WhatsappRepository,
    private readonly gateway: WhatsappGateway,
    private readonly signup: WhatsappSignupGateway,
    private readonly state: WhatsappSignupState,
    private readonly vault: WhatsappTokenVault,
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
