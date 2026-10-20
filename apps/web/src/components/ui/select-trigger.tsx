"use client";

import type { ComponentProps } from "react";
import { ChevronDown } from "lucide-react";
import { Select as SelectPrimitive } from "radix-ui";
import { cn } from "@/lib/utils/cn";

export function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: ComponentProps<typeof SelectPrimitive.Trigger> & { size?: "sm" | "default" }) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        "group flex w-full min-w-0 items-center justify-between gap-2 rounded-xl border border-input bg-background/70 px-3 text-left text-sm text-foreground outline-none transition-colors hover:border-ring/50 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive/25 data-placeholder:text-muted-foreground/70 data-[size=default]:h-11 data-[size=sm]:h-8 [&_[data-slot=select-value]]:truncate",
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown
          className="size-3.5 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180 motion-reduce:transition-none"
          aria-hidden="true"
        />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}
