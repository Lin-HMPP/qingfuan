import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  base: '/qingfuan/',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./', import.meta.url))
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `
          $primary: #48A9A6;
          $primaryLight: #B8E6E1;
          $primaryPress: #9FD8D2;
          $text: #245957;
          $textSecondary: #638F8D;
          $bg: #FFFFFF;
          $white: #FFFFFF;
          $danger: #E8686A;
          $line: #48A9A6;
          $radiusSm: 6px;
          $radiusMd: 8px;
          $radiusLg: 12px;
          $radiusXl: 16px;
          $btnHeight: 44px;
          $fontSm: 10px;
          $fontBase: 13px;
          $fontMd: 15px;
          $fontLg: 18px;
        `
      }
    }
  }
})
