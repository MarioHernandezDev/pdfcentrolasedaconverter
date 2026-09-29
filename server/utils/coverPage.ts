import { type PDFDocument, type PDFFont, type PDFPage, type RGB, StandardFonts, rgb } from 'pdf-lib'

const COLOR_INK: RGB = rgb(0.1255, 0.1451, 0.1333)
const COLOR_MUTED: RGB = rgb(0.4392, 0.4667, 0.4471)
const COLOR_LINE: RGB = rgb(0.898, 0.9098, 0.898)
const COLOR_ACCENT: RGB = rgb(0.3216, 0.4, 0.3569)

const MARGIN = 64
const LOGO_MAX_WIDTH = 120
const SEPARATOR_WIDTH = 140

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

// Dibuja la portada corporativa (logo, titulo y pie institucional) sobre una
// pagina en blanco ya anadida al documento. Autocontenido para poder
// probarse y ajustarse sin tocar la orquestacion de conversion.
export async function drawCorporateCover(
  pdfDoc: PDFDocument,
  page: PDFPage,
  title: string,
  logoBytes: Uint8Array
): Promise<void> {
  const pageWidth = page.getWidth()
  const pageHeight = page.getHeight()

  const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const labelFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const logoImage = await pdfDoc.embedPng(logoBytes)

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
