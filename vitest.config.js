import{defineConfig}from'vitest/config';

export default defineConfig({
  test:{
    include:['tests/**/*.test.js'],
    environment:'node',
    // Le moteur est remplace par un Math.random deterministe dans les tests :
    // on restaure les espions entre chaque test pour eviter toute fuite.
    restoreMocks:true
  }
});
