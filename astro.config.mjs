// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // Site 100 % statique : les lignes et tarifs sont lus depuis src/data/ au build.
  // Les seules ecritures (signalement, log de recherche) passent par functions/,
  // deployees en tant que Cloudflare Pages Functions.
  output: 'static',

  integrations: [react()],

  vite: {
    // Tailwind 4 s'integre via son plugin Vite officiel.
    // @astrojs/tailwind n'est PAS utilisable ici : il exige Astro <=5 et Tailwind 3.
    plugins: [tailwindcss()],
  },
});
