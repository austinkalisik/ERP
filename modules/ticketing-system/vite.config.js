import { defineConfig, loadEnv } from 'vite';
import laravel from 'laravel-vite-plugin';
import { bunny } from 'laravel-vite-plugin/fonts';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const devHost = env.VITE_DEV_HOST || '192.168.31.34';
    const devPort = Number(env.VITE_DEV_PORT || 5173);

    return {
        plugins: [
            laravel({
                input: ['resources/css/app.css', 'resources/js/app.js'],
                refresh: true,
                fonts: [
                    bunny('Instrument Sans', {
                        weights: [400, 500, 600],
                    }),
                ],
            }),
            react(),
            tailwindcss(),
        ],
        server: {
            host: '0.0.0.0',
            port: devPort,
            strictPort: true,
            origin: `http://${devHost}:${devPort}`,
            hmr: {
                host: devHost,
                port: devPort,
                protocol: 'ws',
            },
            watch: {
                usePolling: true,
                ignored: ['**/storage/framework/views/**'],
            },
        },
    };
});
