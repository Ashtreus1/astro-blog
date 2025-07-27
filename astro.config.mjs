// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import amplify from 'astro-aws-amplify'

// https://astro.build/config
export default defineConfig({
  vite: {
      plugins: [tailwindcss()],
      define: {
        'import.meta.env.TOGETHER_API_KEY': JSON.stringify(process.env.TOGETHER_API_KEY),
      },
	},
  integrations: [react()],
  output: 'server',
  adapter: amplify(),
});