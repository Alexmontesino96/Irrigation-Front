"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback, useMemo } from "react";

interface UseListParamsOptions {
  defaultSortBy: string;
  defaultSortOrder: "asc" | "desc";
  defaultPageSize: number;
  filterKeys: string[];
}

export function useListParams({
  defaultSortBy,
  defaultSortOrder,
  defaultPageSize,
  filterKeys,
}: UseListParamsOptions) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const page = Number(searchParams.get("page") || "1");
  const search = searchParams.get("search") || "";
  const sortBy = searchParams.get("sort_by") || defaultSortBy;
  const sortOrder =
    (searchParams.get("sort_order") as "asc" | "desc") || defaultSortOrder;

  const filters = useMemo(() => {
    const f: Record<string, string | null> = {};
    for (const key of filterKeys) {
      f[key] = searchParams.get(key);
    }
    return f;
  }, [searchParams, filterKeys]);

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      const qs = params.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [searchParams, router, pathname]
  );

  const setPage = useCallback(
    (p: number) => updateParams({ page: p === 1 ? null : String(p) }),
    [updateParams]
  );

  const setSearch = useCallback(
    (s: string) => updateParams({ search: s || null, page: null }),
    [updateParams]
  );

  const setSort = useCallback(
    (column: string) => {
      const newOrder =
        column === sortBy ? (sortOrder === "asc" ? "desc" : "asc") : "asc";
      updateParams({
        sort_by: column === defaultSortBy ? null : column,
        sort_order: newOrder === defaultSortOrder ? null : newOrder,
        page: null,
      });
    },
    [sortBy, sortOrder, defaultSortBy, defaultSortOrder, updateParams]
  );

  const setSortDirect = useCallback(
    (column: string, order: "asc" | "desc") => {
      updateParams({
        sort_by: column === defaultSortBy ? null : column,
        sort_order: order === defaultSortOrder ? null : order,
        page: null,
      });
    },
    [defaultSortBy, defaultSortOrder, updateParams]
  );

  const setFilter = useCallback(
    (key: string, value: string | null) => {
      updateParams({ [key]: value, page: null });
    },
    [updateParams]
  );

  const buildApiParams = useCallback(() => {
    const params = new URLSearchParams({
      page: String(page),
      size: String(defaultPageSize),
    });
    if (search) params.set("search", search);
    if (sortBy !== defaultSortBy) params.set("sort_by", sortBy);
    if (sortOrder !== defaultSortOrder) params.set("sort_order", sortOrder);
    for (const key of filterKeys) {
      const v = filters[key];
      if (v) params.set(key, v);
    }
    return params.toString();
  }, [
    page,
    defaultPageSize,
    search,
    sortBy,
    sortOrder,
    defaultSortBy,
    defaultSortOrder,
    filterKeys,
    filters,
  ]);

  return {
    page,
    search,
    sortBy,
    sortOrder,
    filters,
    setPage,
    setSearch,
    setSort,
    setSortDirect,
    setFilter,
    buildApiParams,
  };
}
