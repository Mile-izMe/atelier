/**
 * Prisma 8 can wrap the Postgres error. Match SQLSTATE + constraint, not messages.
 */
export function isUniqueConstraintError(
  error: unknown,
  constraint: string,
): boolean {
  const visited = new Set<object>();
  let current = error;

  while (
    typeof current === 'object' &&
    current !== null &&
    !visited.has(current)
  ) {
    visited.add(current);
    const candidate = current as Record<string, unknown>;
    if (
      (candidate.sqlState === '23505' || candidate.code === '23505') &&
      candidate.constraint === constraint
    ) {
      return true;
    }
    current = candidate.cause;
  }
  return false;
}
