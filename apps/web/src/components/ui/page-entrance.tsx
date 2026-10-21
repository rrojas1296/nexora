"use client";

import { useEffect, useRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type Props = HTMLAttributes<HTMLElement> & {
  as?: "div" | "main";
  nested?: boolean;
};

export function PageEntrance({ as: Tag = "div", nested = false, className, ...props }: Props) {
  const container = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // SSR/prefetch can finish CSS animations before the screen becomes visible.
    // Replaying on activation also covers routes restored by React Activity.
    const animations = container.current?.getAnimations({ subtree: true }) ?? [];
    for (const animation of animations) {
      if (animation instanceof CSSAnimation && animation.animationName === "page-enter") {
        animation.currentTime = 0;
        animation.play();
      }
    }
  }, []);

  return (
    <Tag
      ref={(element) => {
        container.current = element;
      }}
      className={cn(
        nested
          ? "motion-safe:[&>*>*]:animate-page-enter motion-safe:[&>*>:nth-child(2)]:animate-page-enter-2 motion-safe:[&>*>:nth-child(3)]:animate-page-enter-3 motion-safe:[&>*>:nth-child(n+4)]:animate-page-enter-4"
          : "motion-safe:*:animate-page-enter motion-safe:*:nth-2:animate-page-enter-2 motion-safe:*:nth-3:animate-page-enter-3 motion-safe:*:nth-[n+4]:animate-page-enter-4",
        className,
      )}
      {...props}
    />
  );
}
