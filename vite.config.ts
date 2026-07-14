import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import fs from 'node:fs'

function stripDevelopmentField() {
    return {
        name: 'strip-development-field',
        closeBundle() {
            const p = path.join(process.cwd(), 'dist', 'plugin.json')
            if (!fs.existsSync(p)) return
            const json = JSON.parse(fs.readFileSync(p, 'utf-8'))
            delete json.development
            fs.writeFileSync(p, JSON.stringify(json, null, 4) + '\n', 'utf-8')
        },
    }
}

export default defineConfig({
    plugins: [react(), tailwindcss(), stripDevelopmentField()],
    base: './',
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src')
        }
    },
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        emptyOutDir: true,
    },
})
