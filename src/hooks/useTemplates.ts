import { useState, useEffect, useCallback, useMemo } from "react";
import { apiClient } from "../api/client";
import type {
  TemplateCatalog,
  PropertyTemplate,
  TemplateDomain,
  TemplateRef,
} from "../types/templates";
import { instantiateTemplate as instantiate } from "../types/templates";

export interface UseTemplatesReturn {
  /** The full catalog (null while loading). */
  catalog: TemplateCatalog | null;
  /** Whether the catalog is loading. */
  isLoading: boolean;
  /** Error message if fetch failed. */
  error: string | null;
  /** Get templates filtered by domain (includes universal). */
  getForDomain: (domain: TemplateDomain) => PropertyTemplate[];
  /** Get a single template by ID. */
  getById: (id: string) => PropertyTemplate | undefined;
  /** Client-side instantiation for preview. */
  preview: (template: PropertyTemplate, args: Record<string, string>) => string;
  /** Build a TemplateRef from a template and args. */
  buildRef: (templateId: string, args: Record<string, string>) => TemplateRef;
}

/**
 * Hook to fetch and interact with the property template catalog.
 *
 * Fetches `GET /api/v1/templates` on mount and provides filtering,
 * lookup, and client-side instantiation for formula preview.
 */
export function useTemplates(): UseTemplatesReturn {
  const [catalog, setCatalog] = useState<TemplateCatalog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchCatalog = async () => {
      try {
        const res = await apiClient.get<TemplateCatalog>("/templates");
        if (!cancelled) {
          setCatalog(res.data);
          setIsLoading(false);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : "Failed to load templates";
          setError(message);
          setIsLoading(false);
        }
      }
    };

    fetchCatalog();

    return () => {
      cancelled = true;
    };
  }, []);

  const templateMap = useMemo(() => {
    const map = new Map<string, PropertyTemplate>();
    if (catalog) {
      for (const t of catalog.templates) {
        map.set(t.id, t);
      }
    }
    return map;
  }, [catalog]);

  const getForDomain = useCallback(
    (domain: TemplateDomain): PropertyTemplate[] => {
      if (!catalog) return [];
      return catalog.templates.filter(
        (t) =>
          t.domains.includes("universal") || t.domains.includes(domain),
      );
    },
    [catalog],
  );

  const getById = useCallback(
    (id: string): PropertyTemplate | undefined => templateMap.get(id),
    [templateMap],
  );

  const preview = useCallback(
    (template: PropertyTemplate, args: Record<string, string>): string =>
      instantiate(template, args),
    [],
  );

  const buildRef = useCallback(
    (templateId: string, args: Record<string, string>): TemplateRef => ({
      template: templateId,
      args,
    }),
    [],
  );

  return {
    catalog,
    isLoading,
    error,
    getForDomain,
    getById,
    preview,
    buildRef,
  };
}
