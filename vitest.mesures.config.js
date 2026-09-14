import{defineConfig}from'vitest/config';
// Les mesures d'audit ne sont pas des tests : elles vivent hors de `tests/`
// et se lancent a la demande avec `npm run mesures`.
export default defineConfig({test:{include:['Audit/mesures/**/*.test.js'],testTimeout:2400000}});
