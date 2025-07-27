// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import netlify from '@astrojs/netlify/functions';

export default defineConfig({
  vite: {
      plugins: [tailwindcss()],
      define: {
        'import.meta.env.TOGETHER_API_KEY': JSON.stringify(process.env.TOGETHER_API_KEY),
      },
	},
  integrations: [react()],
  output: 'server',
  adapter: netlify(),
});