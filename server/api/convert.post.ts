import { access, readFile, unlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { PDFDocument } from 'pdf-lib'

// El logo, el sticker y el fondo de portada viven en server/assets para que
// Nitro los empaquete junto al codigo del servidor. Leerlos desde public/ no
// es fiable en despliegues serverless: ese directorio se sirve como
// estatico y puede no compartir sistema de ficheros con la funcion en
// tiempo de ejecucion.
const LOGO_ASSET_KEY = 'branding/logo.png'
const STICKER_ASSET_KEY = 'branding/sticker.png'
const BACKGROUND_ASSET_KEY = 'branding/background.png'

function badRequest(message: string) {
  return createError({ statusCode: 400, statusMessage: 'Bad Request', data: { message } })
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

export default defineEventHandler(async (event) => {
  const body = await readBody<{ processId?: string; title?: string }>(event)

  const processId = body?.processId?.trim() ?? ''
  const title = body?.title?.trim() ?? ''

  if (!isValidProcessId(processId)) {
    throw badRequest('Identificador de proceso invalido.')
  }

  if (!title) {
    throw badRequest('El titulo del documento es obligatorio.')
  }

  const inputPath = join(tmpdir(), `${processId}.pdf`)

  if (!(await fileExists(inputPath))) {
    if (await fileExists(join(tmpdir(), `${processId}.pptx`))) {
      throw createError({
        statusCode: 501,
        statusMessage: 'Not Implemented',
        data: { message: 'La generacion de portada para PPTX todavia no esta implementada.' }
      })
    }
    throw createError({
      statusCode: 404,
      statusMessage: 'Not Found',
      data: { message: 'No se encontro el archivo temporal de este proceso. Vuelve a subirlo.' }
    })
  }

  const outputPath = join(tmpdir(), `output-${processId}.pdf`)

  try {
    const storage = useStorage('assets:server')
    const [originalBytes, logoBytes, stickerBytes, backgroundBytes] = await Promise.all([
      readFile(inputPath),
      storage.getItemRaw<Buffer>(LOGO_ASSET_KEY),
      storage.getItemRaw<Buffer>(STICKER_ASSET_KEY),
      storage.getItemRaw<Buffer>(BACKGROUND_ASSET_KEY)
    ])

    if (!logoBytes || !stickerBytes || !backgroundBytes) {
      throw new Error('No se encontraron los assets de marca (logo, sticker o fondo).')
    }

    const originalPdf = await PDFDocument.load(originalBytes)

    const mergedPdf = await PDFDocument.create()
    const assets = await embedBrandAssets(mergedPdf, { logoBytes, stickerBytes, backgroundBytes })

    const [firstOriginalPage] = originalPdf.getPages()
    const pageWidth = firstOriginalPage?.getWidth() ?? 595.28
    const pageHeight = firstOriginalPage?.getHeight() ?? 841.89

    const coverPage = mergedPdf.addPage([pageWidth, pageHeight])
    drawCorporateCover(coverPage, title, assets)

    const copiedPages = await mergedPdf.copyPages(originalPdf, originalPdf.getPageIndices())
    copiedPages.forEach((page) => mergedPdf.addPage(page))

    // Sello de marca (sticker + logo) en el pie de cada pagina del documento
    // original. La portada no lo necesita: ya lleva su propio logo grande y,
    // sobre el fondo ilustrado, un sello tan pequeño se pierde visualmente.
    copiedPages.forEach((page) => drawPageStamp(page, assets))

    const outputBytes = await mergedPdf.save()
    await writeFile(outputPath, outputBytes)
  } catch {
    await unlink(outputPath).catch(() => {})
    throw createError({
      statusCode: 422,
      statusMessage: 'Unprocessable Entity',
      data: { message: 'No se ha podido generar la portada. Comprueba que el archivo es un PDF valido.' }
    })
  } finally {
    // El original ya no hace falta una vez generado (o intentado generar) el resultado.
    await unlink(inputPath).catch(() => {})
  }

  // Red de seguridad si el cliente nunca llega a descargar el resultado.
  scheduleTempFileCleanup(outputPath)

  return {
    success: true,
    processId,
    downloadUrl: `/api/download/${processId}`
  }
})
