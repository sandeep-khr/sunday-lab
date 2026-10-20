import { chromium } from 'playwright-core'

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const URL = process.env.TARGET ?? 'http://localhost:4173'

const buttons = [
  { name: 'SANDBOX LAB', text: 'SANDBOX LAB' },
  { name: 'INTERVIEW ARENA', text: 'INTERVIEW ARENA' },
  { name: 'INCIDENT COMMANDER', text: 'INCIDENT COMMANDER' },
  { name: 'MASTERY TRACKER', text: 'MASTERY TRACKER' },
]

const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const page = await browser.newPage()
const problems = []
page.on('pageerror', (err) => problems.push(`PAGEERROR on [${current}]: ${err.message.split('\n')[0]}`))
page.on('console', (msg) => {
  if (msg.type() === 'error') problems.push(`CONSOLE on [${current}]: ${msg.text().slice(0, 200)}`)
})

let current = 'title'
await page.goto(URL, { waitUntil: 'networkidle' })
await page.waitForTimeout(800)

const bodyHasContent = async () => {
  const text = await page.evaluate(() => document.body.innerText.length)
  return text > 40
}

for (const b of buttons) {
  current = b.name
  const btn = page.locator(`button:has-text("${b.text}")`).first()
  await btn.click()
  await page.waitForTimeout(1200)
  const ok = await bodyHasContent()
  const fault = await page.locator('text=SYSTEM FAULT').count()
  console.log(`${b.name}: content=${ok} faultOverlay=${fault > 0}`)
  if (!ok || fault > 0) problems.push(`${b.name} BLANK/FAULT`)
  const exit = page.locator('button:has-text("EXIT")').first()
  if ((await exit.count()) > 0) {
    await exit.click()
    await page.waitForTimeout(600)
  } else {
    await page.goto(URL, { waitUntil: 'networkidle' })
    await page.waitForTimeout(600)
  }
}

await page.locator('button:has-text("SANDBOX LAB")').first().click()
await page.waitForTimeout(1500)
await page.screenshot({ path: '/tmp/lab-check.png' })

console.log('\n--- PROBLEMS ---')
console.log(problems.length ? problems.join('\n') : 'NONE')
await browser.close()
process.exit(problems.length ? 1 : 0)
