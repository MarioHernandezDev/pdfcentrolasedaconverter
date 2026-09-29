import { unlink } from 'node:fs/promises'

const DEFAULT_TTL_MS = 10 * 60 * 1000

// Red de seguridad por si el cliente nunca descarga el archivo generado
// (pestana cerrada, error de red, etc.). El borrado tras la descarga es el
// camino normal; este timer solo cubre el caso de que no ocurra.
export function scheduleTempFileCleanup(filePath: string, delayMs: number = DEFAULT_TTL_MS): void {
  const timer = setTimeout(() => {
    unlink(filePath).catch(() => {})
  }, delayMs)
  timer.unref?.()
}
