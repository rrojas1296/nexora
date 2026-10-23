"use client";

import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { useState } from "react";

export function ProductImage({ url, name }: { url: string; name: string }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  return (
    <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted">
      {url && failedUrl !== url ? (
        <Image
          src={url}
          alt={name}
          width={56}
          height={56}
          unoptimized
          referrerPolicy="no-referrer"
          className="size-full object-cover"
          onError={() => setFailedUrl(url)}
        />
      ) : (
        <ImageIcon className="size-5 text-muted-foreground" aria-hidden="true" />
      )}
    </div>
  );
}
