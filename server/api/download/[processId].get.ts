import { createReadStream } from 'node:fs'
import { access, stat, unlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

export default defineEventHandler(async (event) => {
  const processId = getRouterParam(event, 'processId') ?? ''

  if (!isValidProcessId(processId)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      data: { message: 'Identificador de proceso invalido.' }
    })
  }

  const outputPath = join(tmpdir(), `output-${processId}.pdf`)

  try {
    await access(outputPath)
  } catch {
    throw createError({
      statusCode: 404,
      statusMessage: 'Not Found',
      data: { message: 'El documento no esta disponible o ya ha sido descargado.' }
    })
  }

  const { size } = await stat(outputPath)

  setResponseHeaders(event, {
    'Content-Type': 'application/pdf',
    'Content-Length': String(size),
    'Content-Disposition': `attachment; filename="documento-${processId}.pdf"`
  })

  const stream = createReadStream(outputPath)

  // Limpieza justo despues de que el archivo se ha servido por completo
  // (o la conexion se ha cerrado, exitosa o no).
  stream.on('close', () => {
    unlink(outputPath).catch(() => {})
  })

  return sendStream(event, stream)
})
