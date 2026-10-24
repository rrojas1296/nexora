import { z } from "zod";
import { envelope } from "../../../common/documentation/response-schemas.js";

const id = z.uuid();
export const businessResponse = envelope(z.object({ id, name: z.string(), slug: z.string() }));
