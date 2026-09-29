const PROCESS_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Los processId provienen de randomUUID() y se usan para construir rutas en
// tmpdir(). Validar el formato exacto evita path traversal con un valor manipulado.
export function isValidProcessId(value: string): boolean {
  return PROCESS_ID_PATTERN.test(value)
}
