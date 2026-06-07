import type { SupabaseClient } from "@supabase/supabase-js";

/** PostgREST / Supabase plafonne par défaut à 1000 lignes par requête */
const PAGE_SIZE = 1000;

type QueryBuilder = {
  range: (from: number, to: number) => PromiseLike<{ data: unknown[] | null; error: { message: string } | null }>;
};

/**
 * Récupère toutes les lignes d'une table/vue en paginant par blocs de 1000.
 */
export async function fetchAllRows<T>(
  runQuery: (
    rangeFrom: number,
    rangeTo: number,
  ) => Promise<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[]> {
  const rows: T[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await runQuery(offset, offset + PAGE_SIZE - 1);
    if (error) {
      throw new Error(error.message);
    }
    if (!data?.length) break;
    rows.push(...data);
    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return rows;
}

export function paginatedSelect(
  client: SupabaseClient,
  table: string,
  columns: string,
  applyFilters: (query: ReturnType<SupabaseClient["from"]>) => QueryBuilder,
) {
  return fetchAllRows<Record<string, unknown>>((from, to) => {
    const base = client.from(table).select(columns);
    const filtered = applyFilters(base) as unknown as QueryBuilder;
    return filtered.range(from, to) as Promise<{
      data: Record<string, unknown>[] | null;
      error: { message: string } | null;
    }>;
  });
}
