import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (chunk) => {
      data += chunk
    })
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

// Emulates Vercel's api/ serverless functions inside the Vite dev server, so
// `npm run dev` alone is enough to exercise /api/* locally. Production
// deploys on Vercel run the same files as real serverless functions.
function vercelApiDevMiddleware() {
  return {
    name: 'vercel-api-dev-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith('/api/')) return next()

        const pathname = req.url.split('?')[0]
        const routeName = pathname.replace('/api/', '')
        const filePath = path.join(process.cwd(), 'api', `${routeName}.js`)
        if (!fs.existsSync(filePath)) return next()

        try {
          const raw = await readBody(req)
          req.body = raw ? JSON.parse(raw) : {}
        } catch {
          req.body = {}
        }

        try {
          const mod = await import(`${pathToFileURL(filePath).href}?t=${Date.now()}`)
          await mod.default(req, res)
        } catch (err) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: String(err) }))
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''))
  return {
    plugins: [react(), tailwindcss(), vercelApiDevMiddleware()],
  }
})
