/** SQL string literal. Only used for values these scripts generate or read from their own env. */
export const q = (value: string | number | null) =>
  value === null
    ? 'NULL'
    : typeof value === 'number'
      ? String(value)
      : `'${value.replace(/'/g, "''")}'`;
