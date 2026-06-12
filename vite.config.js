import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  plugins: [viteSingleFile()],
  build: {
    minify: true,
    chunkSizeWarningLimit: 2000,
    assetsInlineLimit: 100000000, // 모든 에셋을 인라인화
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      }
    }
  }
});
