import { Bot, MessageCircleMore, Package } from "lucide-react";
import { getTranslations } from "next-intl/server";

export async function ConnectionFlow() {
  const t = await getTranslations("Workspace");
  const nav = await getTranslations("Nav");
  return (
    <div className="mt-8 rounded-2xl border border-border/70 bg-background/60 px-4 pt-7 pb-5 sm:px-8">
      <div className="flex items-center" aria-hidden="true">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl border bg-card sm:size-14">
          <MessageCircleMore className="size-5 text-muted-foreground" strokeWidth={1.4} />
        </span>
        <span className="h-px flex-1 bg-border" />
        <span className="size-1.5 rounded-full bg-secondary-foreground/60" />
        <span className="h-px flex-1 bg-border" />
        <span className="flex size-16 shrink-0 items-center justify-center rounded-full border-4 border-secondary bg-secondary text-secondary-foreground ring-1 ring-secondary-foreground/30 ring-offset-8 ring-offset-background">
          <Bot className="size-7" strokeWidth={1.3} />
        </span>
        <span className="h-px flex-1 bg-border" />
        <span className="size-1.5 rounded-full bg-highlight" />
        <span className="h-px flex-1 bg-border" />
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-highlight/60 bg-highlight text-highlight-foreground sm:size-14">
          <Package className="size-5" strokeWidth={1.4} />
        </span>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
        <span>{nav("conversations")}</span>
        <span className="text-center">{nav("agent")}</span>
        <span className="text-right">{nav("products")}</span>
      </div>
      <p className="mt-5 border-t border-border/70 pt-3 text-center text-xs leading-5 text-muted-foreground">
        {t("flowCaption")}
      </p>
    </div>
  );
}
