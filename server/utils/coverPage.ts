import { type PDFDocument, type PDFFont, type PDFImage, type PDFPage, type RGB, StandardFonts, rgb } from 'pdf-lib'

const COLOR_INK: RGB = rgb(0.1255, 0.1451, 0.1333)
const COLOR_MUTED: RGB = rgb(0.4392, 0.4667, 0.4471)
const COLOR_LINE: RGB = rgb(0.898, 0.9098, 0.898)
const COLOR_ACCENT: RGB = rgb(0.3216, 0.4, 0.3569)

const MARGIN = 64
const LOGO_MAX_WIDTH = 120
const SEPARATOR_WIDTH = 140

const STAMP_MARGIN = 16
const STAMP_STICKER_HEIGHT = 20
const STAMP_LOGO_HEIGHT = 13

export interface BrandAssets {
  logoImage: PDFImage
  stickerImage: PDFImage
  backgroundImage: PDFImage
  titleFont: PDFFont
  labelFont: PDFFont
}

// Embebe logo, sticker, fondo de portada y tipografias una sola vez por
// documento. Las imagenes resultantes son reutilizables en cuantas paginas
// haga falta sin duplicar los datos binarios dentro del PDF.
export async function embedBrandAssets(
  pdfDoc: PDFDocument,
  bytes: { logoBytes: Uint8Array; stickerBytes: Uint8Array; backgroundBytes: Uint8Array }
): Promise<BrandAssets> {
  const [titleFont, labelFont, logoImage, stickerImage, backgroundImage] = await Promise.all([
    pdfDoc.embedFont(StandardFonts.HelveticaBold),
    pdfDoc.embedFont(StandardFonts.Helvetica),
    pdfDoc.embedPng(bytes.logoBytes),
    pdfDoc.embedPng(bytes.stickerBytes),
    pdfDoc.embedPng(bytes.backgroundBytes)
  ])

  return { logoImage, stickerImage, backgroundImage, titleFont, labelFont }
}

// Dibuja la imagen de fondo cubriendo toda la pagina (recortando el
// sobrante fuera de los limites), manteniendo su proporcion original.
function drawCoverBackground(page: PDFPage, backgroundImage: PDFImage): void {
  const pageWidth = page.getWidth()
  const pageHeight = page.getHeight()

  const scale = Math.max(pageWidth / backgroundImage.width, pageHeight / backgroundImage.height)
  const drawnWidth = backgroundImage.width * scale
  const drawnHeight = backgroundImage.height * scale

  page.drawImage(backgroundImage, {
    x: (pageWidth - drawnWidth) / 2,
    y: (pageHeight - drawnHeight) / 2,
    width: drawnWidth,
    height: drawnHeight
  })
}

function wrapText(font: PDFFont, text: string, maxWidth: number, fontSize: number): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word
    if (currentLine && font.widthOfTextAtSize(candidate, fontSize) > maxWidth) {
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = candidate
    }
  }
  if (currentLine) lines.push(currentLine)
  return lines.length ? lines : ['']
}

function drawCenteredText(
  page: PDFPage,
  text: string,
  opts: { font: PDFFont; size: number; y: number; color: RGB; pageWidth: number }
) {
  const width = opts.font.widthOfTextAtSize(text, opts.size)
  page.drawText(text, {
    x: (opts.pageWidth - width) / 2,
    y: opts.y,
    size: opts.size,
    font: opts.font,
    color: opts.color
  })
}

function drawTrackedText(
  page: PDFPage,
  text: string,
  opts: { font: PDFFont; size: number; tracking: number; y: number; color: RGB; pageWidth: number }
) {
  const { font, size, tracking, y, color, pageWidth } = opts
  const glyphWidths = [...text].map((char) => font.widthOfTextAtSize(char, size))
  const totalWidth = glyphWidths.reduce((sum, width) => sum + width, 0) + tracking * Math.max(text.length - 1, 0)
  let x = (pageWidth - totalWidth) / 2

  for (let i = 0; i < text.length; i += 1) {
    page.drawText(text[i], { x, y, size, font, color })
    x += glyphWidths[i] + tracking
  }
}

function drawCenteredLine(page: PDFPage, y: number, pageWidth: number, width: number) {
  const x = (pageWidth - width) / 2
  page.drawLine({
    start: { x, y },
    end: { x: x + width, y },
    thickness: 0.75,
    color: COLOR_LINE
  })
}

// Dibuja la portada corporativa (fondo, logo, titulo y pie institucional)
// sobre una pagina en blanco ya anadida al documento. Solo se usa en la
// portada: el resto de paginas del documento mantienen fondo blanco.
export function drawCorporateCover(page: PDFPage, title: string, assets: BrandAssets): void {
  const { logoImage, backgroundImage, titleFont, labelFont } = assets
  const pageWidth = page.getWidth()
  const pageHeight = page.getHeight()

  drawCoverBackground(page, backgroundImage)

  const logoScale = Math.min(1, LOGO_MAX_WIDTH / logoImage.width)
  const logoWidth = logoImage.width * logoScale
  const logoHeight = logoImage.height * logoScale
  const logoY = pageHeight - MARGIN - logoHeight

  page.drawImage(logoImage, {
    x: (pageWidth - logoWidth) / 2,
    y: logoY,
    width: logoWidth,
    height: logoHeight
  })

  drawCenteredLine(page, logoY - 28, pageWidth, SEPARATOR_WIDTH)

  const titleSize = 27
  const titleLineHeight = titleSize * 1.25
  const titleMaxWidth = pageWidth - MARGIN * 2
  const titleLines = wrapText(titleFont, title, titleMaxWidth, titleSize)
  const titleBlockHeight = titleLines.length * titleLineHeight
  let titleY = pageHeight / 2 + titleBlockHeight / 2 - titleSize

  for (const line of titleLines) {
    drawCenteredText(page, line, { font: titleFont, size: titleSize, y: titleY, color: COLOR_INK, pageWidth })
    titleY -= titleLineHeight
  }

  const dateLabel = `Documento generado el ${new Intl.DateTimeFormat('es-ES', { dateStyle: 'long' }).format(new Date())}`
  drawCenteredText(page, dateLabel, {
    font: labelFont,
    size: 10,
    y: titleY - 12,
    color: COLOR_MUTED,
    pageWidth
  })

  drawCenteredLine(page, MARGIN + 74, pageWidth, SEPARATOR_WIDTH)

  drawTrackedText(page, 'CENTRO LASEDA — PSICOLOGIA GRANADA', {
    font: labelFont,
    size: 8.5,
    tracking: 1.4,
    y: MARGIN + 52,
    color: COLOR_MUTED,
    pageWidth
  })

  drawCenteredText(page, 'www.centrolaseda.com', {
    font: labelFont,
    size: 11.5,
    y: MARGIN + 30,
    color: COLOR_ACCENT,
    pageWidth
  })
}

// Sello discreto: sticker en la esquina inferior izquierda, logo en la
// inferior derecha. Se aplica a la portada y a cada pagina del documento
// original para que la identidad de marca quede visible en todo el PDF.
export function drawPageStamp(page: PDFPage, assets: BrandAssets): void {
  const { logoImage, stickerImage } = assets
  const pageWidth = page.getWidth()
  const pageHeight = page.getHeight()

  const stickerScale = STAMP_STICKER_HEIGHT / stickerImage.height
  const stickerWidth = stickerImage.width * stickerScale

  const logoScale = STAMP_LOGO_HEIGHT / logoImage.height
  const logoWidth = logoImage.width * logoScale

  // Si la pagina original es mas baja que el margen del sello (poco
  // probable, pero posible en tamanos no estandar), se omite para no
  // dibujar fuera de los limites de la pagina.
  if (pageHeight < STAMP_MARGIN + Math.max(STAMP_STICKER_HEIGHT, STAMP_LOGO_HEIGHT)) return

  page.drawImage(stickerImage, {
    x: STAMP_MARGIN,
    y: STAMP_MARGIN,
    width: stickerWidth,
    height: STAMP_STICKER_HEIGHT
  })

  page.drawImage(logoImage, {
    x: pageWidth - STAMP_MARGIN - logoWidth,
    y: STAMP_MARGIN,
    width: logoWidth,
    height: STAMP_LOGO_HEIGHT
  })
}
