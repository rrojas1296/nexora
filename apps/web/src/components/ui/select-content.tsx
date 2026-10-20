"use client";

import type { ComponentProps } from "react";
import { Select as SelectPrimitive } from "radix-ui";
import { cn } from "@/lib/utils/cn";
import { SelectScrollUpButton } from "./select-scroll-up-button";
import { SelectScrollDownButton } from "./select-scroll-down-button";

export function SelectContent({
  className,
  children,
  position = "popper",
  align = "start",
  sideOffset = 6,
  ...props
}: ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        className={cn(
          "relative z-100 max-h-(--radix-select-content-available-height) min-w-32 overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-lg shadow-black/15",
          className,
        )}
        position={position}
        align={align}
        sideOffset={sideOffset}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            "p-1",
            position === "popper" && "w-full min-w-(--radix-select-trigger-width)",
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}
