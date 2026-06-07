/** PostgREST / Supabase plafonne par défaut à 1000 lignes par requête */
const PAGE_SIZE = 1000;

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
