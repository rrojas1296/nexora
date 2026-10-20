"use client";

export const sessionChannelName = "conversa-session";

export function notifySessionChange() {
  if (typeof BroadcastChannel === "undefined") return;
  const channel = new BroadcastChannel(sessionChannelName);
  channel.postMessage("changed");
  channel.close();
}
