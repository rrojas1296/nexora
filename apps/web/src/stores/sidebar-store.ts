"use client";

import { create } from "zustand";

type SidebarState = {
  collapsed: boolean;
  toggleCollapsed: () => void;
};

export const useSidebarStore = create<SidebarState>((set) => ({
  collapsed: false,
  toggleCollapsed: () => set((state) => ({ collapsed: !state.collapsed })),
}));
