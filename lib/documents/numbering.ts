export function formatDocumentNumber(prefix: string, sequence: number, width = 4) {
  return `${prefix}${String(sequence).padStart(width, "0")}`;
}

export function nextSequenceFromNumber(documentNumber: string | null | undefined, prefix: string) {
  if (!documentNumber?.startsWith(prefix)) return 1;
  const parsed = Number.parseInt(documentNumber.slice(prefix.length), 10);
  return Number.isFinite(parsed) ? parsed + 1 : 1;
}
