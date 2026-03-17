import { chromium } from 'playwright'
import { resolve } from 'path'

async function main() {
  const htmlPath = resolve(__dirname, 'report-attorney-sources.html')
  const pdfPath = resolve(__dirname, '..', 'US-Attorneys-Data-Sources-Report.pdf')

  console.log('Launching browser...')
  const browser = await chromium.launch()
  const page = await browser.newPage()

  console.log(`Loading ${htmlPath}...`)
  await page.goto(`file:///${htmlPath.replace(/\\/g, '/')}`, { waitUntil: 'networkidle' })

  // Wait for fonts to load
  await page.waitForTimeout(2000)

  console.log('Generating PDF...')
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '0', bottom: '0', left: '0', right: '0' },
  })

  await browser.close()
  console.log(`PDF saved to: ${pdfPath}`)
}

main().catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
