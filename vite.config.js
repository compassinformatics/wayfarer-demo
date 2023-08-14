import copy from 'rollup-plugin-copy'
const path = require('path')

export default {
    base: '', // otherwise assets are located at /assets
    root: path.resolve(__dirname, 'src'),
    server: {
        port: 5173,
        hot: true,
        proxy: {
            // note the Python services must also be deployed to an /api end point
            '/api': {
                target: 'http://127.0.0.1:8020',
                changeOrigin: true,
                secure: false
            }
        }
    },
    build: {
        sourcemap: true,
        outDir: '../dist', // otherwise writes to src/dist
        rollupOptions: {
            input: {
                main: path.resolve(__dirname, 'src/index.html'),
                edges: path.resolve(__dirname, 'src/edges.html'),
                isochrones: path.resolve(__dirname, 'src/isochrones.html'),
                rivers: path.resolve(__dirname, 'src/rivers.html'),
                routes: path.resolve(__dirname, 'src/routes.html')
            },
            plugins: [
                copy({
                    targets: [
                        { src: 'src/data/*.json', dest: 'dist/data' }
                    ],
                    hook: 'writeBundle'
                })
            ]
        }

    }
}
