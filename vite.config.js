import { pbkdf2Sync } from 'node:crypto'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// Optional site-wide passcode: set CHEQUE_PASSCODE (e.g. in Netlify > Site configuration > Environment variables)
// and every visitor on every browser must enter it. Only a salted hash is put in the build, never the passcode itself.
const SITE_SALT = 'cheque-maker-site'
const sitePass = process.env.CHEQUE_PASSCODE
const siteLock = sitePass
  ? { salt: SITE_SALT, hash: pbkdf2Sync(sitePass, SITE_SALT, 150000, 32, 'sha256').toString('hex') }
  : null

// viteSingleFile inlines JS/CSS so dist/index.html opens straight from disk (no server needed).
export default defineConfig({
  base: './',
  plugins: [react(), viteSingleFile()],
  define: { __SITE_LOCK__: JSON.stringify(siteLock) },
})