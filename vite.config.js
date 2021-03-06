// Consult https://vitejs.dev/config/ to learn about these or more options
import { defineConfig } from 'vite';
import svelte from '@svitejs/vite-plugin-svelte';
import legacy from '@vitejs/plugin-legacy';

export default defineConfig(({ mode }) => {
  const production = mode === 'production';

  return {
    plugins: [
      svelte({
        hot: !production,
        emitCss: true,
      }),
      legacy({
        targets: ['defaults', 'not IE 11'],
      }),
    ],
    build: {
      minify: production, //terser
    },
  };
});
