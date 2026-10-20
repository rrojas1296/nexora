"use client";

import { useState } from "react";
export function usePagedRows<T>(rows: readonly T[], size = 5) {
  const [requestedPage, setPage] = useState(1);
  const pages = Math.max(1, Math.ceil(rows.length / size));
  const page = Math.min(requestedPage, pages);
  return { rows: rows.slice((page - 1) * size, page * size), page, pages, setPage };
}
