import type Konva from 'konva'

// A real bank card (the "CR80" size) is 85.6 mm wide and 54 mm tall.
const CR80_WIDTH_MM = 85.6
const CR80_HEIGHT_MM = 54

// On a phone the canvas is drawn smaller (scaled down). Dividing by the scale
// means exports always come out at the same full quality on any screen.
function exportPixelRatio(stage: Konva.Stage, wanted: number): number {
  return wanted / stage.scaleX()
}

// Make the browser download a data URL as a file.
function triggerDownload(dataUrl: string, fileName: string): void {
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
}

// PNG: a picture of the canvas at 2x resolution (800 x 504 pixels).
export function downloadPng(stage: Konva.Stage): void {
  const dataUrl = stage.toDataURL({ pixelRatio: exportPixelRatio(stage, 2) })
  triggerDownload(dataUrl, 'cardcraft-design.png')
}

// PDF: one page exactly the size of a real card, with the canvas image
// (at 3x resolution) filling the page.
export async function downloadPdf(stage: Konva.Stage): Promise<void> {
  // jsPDF is big, so we only load it the first time someone exports a PDF.
  // This keeps the first page load fast.
  const { jsPDF } = await import('jspdf')
  const dataUrl = stage.toDataURL({ pixelRatio: exportPixelRatio(stage, 3) })

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [CR80_WIDTH_MM, CR80_HEIGHT_MM],
  })
  pdf.addImage(dataUrl, 'PNG', 0, 0, CR80_WIDTH_MM, CR80_HEIGHT_MM)
  pdf.save('cardcraft-design.pdf')
}
