export const SIGNED_CSRF = Symbol("ISignedCsrf");

export interface ISignedCsrf {
  issue(context: string): string;
  verify(token: string, context: string): boolean;
  equal(left: string, right: string): boolean;
}
