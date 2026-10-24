import { agentInputSchema } from "./agents.dto.js";
import { z } from "zod";
import { envelope } from "../../../common/documentation/response-schemas.js";

const id = z.uuid();
const timestamp = z.iso.datetime();
const timestamps = { createdAt: timestamp, updatedAt: timestamp };

const agent = agentInputSchema.extend({ id, ...timestamps });
export const agentResponse = envelope(agent);
export const nullableAgentResponse = envelope(agent.nullable());
