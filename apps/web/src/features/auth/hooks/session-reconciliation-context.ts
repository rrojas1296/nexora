"use client";

import { createContext } from "react";

// Returning to a tab may reveal a different cookie identity: hide its old UI first.
export const SessionReconciliationContext = createContext(false);
