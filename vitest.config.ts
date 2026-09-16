/// <reference types="vitest" />
import { getViteConfig } from 'astro/config';

// getViteConfig reprend la resolution de modules d'Astro (alias @lib/*, import JSON),
// ce qui permet de tester src/lib/ exactement comme il tourne dans l'app.
export default getViteConfig({
  test: {
    // La logique metier de src/lib/ ne touche pas au DOM : environnement node.
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    globals: false,
  },
});
