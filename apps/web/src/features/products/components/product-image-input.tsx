"use client";

import Image from "next/image";
import { ImageIcon, Link2, LoaderCircle, UploadCloud, X } from "lucide-react";
import { useId, useRef, useState } from "react";
import { useController, type Control } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { useValidationMessage } from "@/features/demo/hooks/use-validation-message";
import { productInputSchema, type ProductInput } from "../schemas/product-schema";
import { productErrorKey } from "../services/product-error";

export function ProductImageInput({
  control,
  disabled,
  uploading,
  upload,
  isCurrent,
}: {
  control: Control<ProductInput>;
  disabled: boolean;
  uploading: boolean;
  upload: (file: File) => Promise<string>;
  isCurrent: () => boolean;
}) {
  const t = useTranslations("Products");
  const validationMessage = useValidationMessage();
  const { field, fieldState } = useController({ control, name: "imageUrl" });
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const inFlight = useRef(false);
  const dragDepth = useRef(0);
  const [dragging, setDragging] = useState(false);
  const [mode, setMode] = useState<"file" | "url">(field.value.startsWith("http") ? "url" : "file");
  const [draft, setDraft] = useState(field.value.startsWith("http") ? field.value : "");
  const [error, setError] = useState<string | null>(null);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const [filename, setFilename] = useState("");
  const blocked = disabled || uploading;
  const message = error ?? (fieldState.error ? validationMessage(fieldState.error) : null);

  async function selectFiles(files: FileList | null) {
    if (blocked || inFlight.current) return;
    if (!files || files.length !== 1) {
      setError(t("imageSingleFile"));
      return;
    }
    const file = files[0];
    if (!file || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError(t("imageFileType"));
      return;
    }
    if (!file.size || file.size > 2 * 1024 * 1024) {
      setError(t("imageFileSize"));
      return;
    }
    inFlight.current = true;
    setError(null);
    setFilename(file.name);
    try {
      const url = await upload(file);
      if (!isCurrent()) return;
      field.onChange(url);
      field.onBlur();
      setFailedUrl(null);
    } catch (cause) {
      setFilename("");
      if (isCurrent()) setError(t(`errors.${productErrorKey(cause, true)}`));
    } finally {
      inFlight.current = false;
    }
  }

  function applyUrl() {
    if (blocked) return;
    const url = draft.trim();
    if (!/^https?:\/\//i.test(url) || !productInputSchema.shape.imageUrl.safeParse(url).success) {
      setError(t("imageUrlInvalid"));
      return;
    }
    setError(null);
    setFilename("");
    setFailedUrl(null);
    field.onChange(url);
    field.onBlur();
  }

  return (
    <section aria-labelledby={`${id}-title`} className="overflow-hidden rounded-2xl border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
        <div>
          <h2 id={`${id}-title`} className="text-base font-medium">
            {t("imageTitle")}
          </h2>
          <p id={`${id}-hint`} className="mt-1 text-xs text-muted-foreground">
            {t("imageUploadHint")}
          </p>
        </div>
        <fieldset className="flex gap-1 rounded-lg bg-muted p-1">
          <legend className="sr-only">{t("imageSource")}</legend>
          <Button
            size="sm"
            variant={mode === "file" ? "secondary" : "ghost"}
            aria-pressed={mode === "file"}
            disabled={blocked}
            onClick={() => {
              setMode("file");
              setError(null);
            }}
          >
            <UploadCloud className="size-4" aria-hidden="true" />
            {t("imageDevice")}
          </Button>
          <Button
            size="sm"
            variant={mode === "url" ? "secondary" : "ghost"}
            aria-pressed={mode === "url"}
            disabled={blocked}
            onClick={() => {
              setMode("url");
              setError(null);
            }}
          >
            <Link2 className="size-4" aria-hidden="true" />
            {t("imageUrl")}
          </Button>
        </fieldset>
      </div>
      <div className="grid gap-5 p-5 sm:grid-cols-3">
        <div className="relative flex aspect-square max-h-56 items-center justify-center overflow-hidden rounded-xl border bg-muted/40">
          {field.value && failedUrl !== field.value ? (
            <Image
              key={field.value}
              src={field.value}
              alt={t("imagePreview")}
              width={224}
              height={224}
              unoptimized
              referrerPolicy="no-referrer"
              className="size-full object-contain p-3"
              onError={() => setFailedUrl(field.value)}
            />
          ) : (
            <div className="flex flex-col items-center gap-3 px-4 text-center text-muted-foreground">
              <ImageIcon className="size-8" aria-hidden="true" />
              <span className="text-xs">
                {field.value ? t("imagePreviewError") : t("imageNoPreview")}
              </span>
            </div>
          )}
          {field.value ? (
            <Button
              variant="secondary"
              size="icon"
              className="absolute top-2 right-2 size-8"
              aria-label={t("imageRemove")}
              disabled={blocked}
              onClick={() => {
                field.onChange("");
                field.onBlur();
                setDraft("");
                setFilename("");
                setError(null);
              }}
            >
              <X className="size-4" aria-hidden="true" />
            </Button>
          ) : null}
        </div>
        <div className="flex min-w-0 flex-col justify-center gap-3 sm:col-span-2">
          {mode === "file" ? (
            <div
              className={cn(
                "flex min-h-44 flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-5 py-6 text-center transition-colors",
                dragging && !blocked ? "border-primary bg-primary/10" : "border-border bg-muted/20",
                blocked && "opacity-60",
              )}
              onDragEnter={(event) => {
                event.preventDefault();
                if (!blocked) {
                  dragDepth.current++;
                  setDragging(true);
                }
              }}
              onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = blocked ? "none" : "copy";
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                dragDepth.current = Math.max(0, dragDepth.current - 1);
                if (!dragDepth.current) setDragging(false);
              }}
              onDrop={(event) => {
                event.preventDefault();
                dragDepth.current = 0;
                setDragging(false);
                void selectFiles(event.dataTransfer.files);
              }}
            >
              {uploading ? (
                <LoaderCircle
                  className="size-7 animate-spin motion-reduce:animate-none text-primary"
                  aria-hidden="true"
                />
              ) : (
                <UploadCloud className="size-7 text-primary" aria-hidden="true" />
              )}
              <p className="text-sm font-medium">
                {t(uploading ? "imageUploading" : dragging ? "imageDropHere" : "imageDrag")}
              </p>
              <Button
                ref={(node) => field.ref(node)}
                variant="outline"
                size="sm"
                disabled={blocked}
                onClick={() => input.current?.click()}
              >
                {t("imageChoose")}
              </Button>
              <input
                ref={input}
                id={`${id}-file`}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                tabIndex={-1}
                disabled={blocked}
                aria-label={t("imageChoose")}
                aria-describedby={`${id}-hint`}
                onChange={(event) => {
                  void selectFiles(event.target.files);
                  event.target.value = "";
                }}
              />
            </div>
          ) : (
            <div className="space-y-3">
              <label htmlFor={`${id}-url`} className="block text-sm font-medium">
                {t("imagePasteUrl")}
              </label>
              <div className="flex flex-col gap-2 md:flex-row">
                <input
                  ref={(node) => field.ref(node)}
                  id={`${id}-url`}
                  type="url"
                  value={draft}
                  maxLength={2048}
                  placeholder="https://…"
                  disabled={blocked}
                  aria-describedby={`${id}-hint ${id}-message`}
                  aria-invalid={!!message}
                  className="h-10 min-w-0 flex-1 rounded-xl border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                  onChange={(event) => {
                    setDraft(event.target.value);
                    setError(null);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      applyUrl();
                    }
                  }}
                />
                <Button variant="outline" disabled={blocked} onClick={applyUrl}>
                  {t("imageUseUrl")}
                </Button>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {t("imageRemoteHint")}
              </p>
            </div>
          )}
          <output className="block truncate text-xs text-muted-foreground">
            {uploading ? t("imageUploading") : field.value ? t("imageReady") : t("imageOptional")}
            {filename && mode === "file" ? ` · ${filename}` : ""}
          </output>
          <p
            id={`${id}-message`}
            role={message ? "alert" : undefined}
            className="text-xs text-destructive"
          >
            {message}
          </p>
        </div>
      </div>
    </section>
  );
}
