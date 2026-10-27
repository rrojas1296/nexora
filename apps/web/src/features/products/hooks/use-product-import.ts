"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useProductAccess } from "./use-products";
import { productsService } from "../services/products-service";
import { productErrorKey } from "../services/product-error";
import type { ImportRow } from "../services/product-spreadsheet";

export type ImportResult = { number: number; error?: ReturnType<typeof productErrorKey> };

export function useProductImport() {
  const access = useProductAccess();
  const queryClient = useQueryClient();
  const mounted = useRef(true);
  const [results, setResults] = useState<ImportResult[]>([]);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const mutation = useMutation({
    mutationKey: ["products", access.scope?.userId, access.scope?.businessId, "import"],
    retry: false,
    gcTime: 0,
    mutationFn: async (rows: ImportRow[]) => {
      if (
        !access.scope ||
        !access.canWrite ||
        !rows.length ||
        rows.some((row) => !row.input || row.issues.length)
      )
        throw new Error("PRODUCT_FORBIDDEN");
      setResults([]);
      // Create-only, one transaction per row. Never retry an uncertain POST.
      for (const row of rows) {
        if (!mounted.current || !access.isCurrent()) break;
        try {
          if (!row.input) break;
          await productsService.save(access.scope, row.input);
          if (mounted.current && access.isCurrent())
            setResults((current) => [...current, { number: row.number }]);
        } catch (error) {
          if (mounted.current && access.isCurrent())
            setResults((current) => [
              ...current,
              { number: row.number, error: productErrorKey(error, true) },
            ]);
          // Stop at the first failure, including rate limits or a lost response.
          break;
        }
      }
    },
    onSettled: async () => {
      if (!access.isCurrent()) return;
      const queryKey = ["products", access.scope?.userId, access.scope?.businessId];
      await queryClient.cancelQueries({ queryKey });
      await queryClient.invalidateQueries({ queryKey });
    },
  });
  return { ...mutation, results };
}
