import { randomUUID } from 'node:crypto'
import { writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const ALLOWED_EXTENSIONS = new Set(['pdf', 'pptx'])

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation'
])

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024

function badRequest(message: string) {
  return createError({
    statusCode: 400,
    statusMessage: 'Bad Request',
    data: { message }
  })
}

export default defineEventHandler(async (event) => {
  // Rechazo temprano por tamano antes de parsear el cuerpo multipart.
  const declaredSize = Number(getRequestHeader(event, 'content-length') ?? 0)
  if (declaredSize > MAX_FILE_SIZE_BYTES) {
    throw badRequest('El archivo supera el limite permitido de 20 MB.')
  }

  const formData = await readMultipartFormData(event)

  if (!formData || formData.length === 0) {
    throw badRequest('La peticion no contiene datos.')
  }

  const filePart = formData.find((part) => part.name === 'file')
  const titlePart = formData.find((part) => part.name === 'title')

  if (!filePart || !filePart.filename || !filePart.data?.length) {
    throw badRequest('No se ha adjuntado ningun archivo.')
  }

  const title = titlePart?.data.toString('utf-8').trim()
  if (!title) {
    throw badRequest('El titulo del documento es obligatorio.')
  }

  const extension = filePart.filename.split('.').pop()?.toLowerCase() ?? ''
  const mimeType = filePart.type ?? ''

  if (!ALLOWED_EXTENSIONS.has(extension) || !ALLOWED_MIME_TYPES.has(mimeType)) {
    throw badRequest('Formato no admitido. Solo se aceptan archivos PDF o PPTX.')
  }

  if (filePart.data.length > MAX_FILE_SIZE_BYTES) {
    throw badRequest('El archivo supera el limite permitido de 20 MB.')
  }

  // El nombre en disco usa el UUID, nunca el nombre original, para evitar
  // colisiones y path traversal a partir de un filename manipulado.
  const processId = randomUUID()
  const tempFilePath = join(tmpdir(), `${processId}.${extension}`)

  try {
    await writeFile(tempFilePath, filePart.data)
  } catch {
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      data: { message: 'No se ha podido guardar el archivo en el servidor.' }
    })
  }

  setResponseStatus(event, 201)

  return {
    success: true,
    processId,
    fileName: filePart.filename,
    title,
    status: 'ready_for_conversion'
  }
})
