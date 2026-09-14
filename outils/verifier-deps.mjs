// Contrôle avant le lancement : les dépendances déclarées sont-elles installées ?
//
// Raison d'être : après un `git pull` qui ajoute une dépendance, `npm run dev`
// part quand même et Vite s'écrase sur « Failed to resolve import "pixi.js" »
// au milieu d'une pile d'appels de trente lignes. Le problème n'est pas là où
// l'erreur pointe, et rien ne dit qu'il faut lancer `npm install`.
//
// Ce contrôle ne bloque jamais pour autre chose que ça : au moindre imprévu il
// se tait et laisse passer.
import fs from'node:fs';
import path from'node:path';

try{
  const racine=process.cwd();
  const manifeste=JSON.parse(fs.readFileSync(path.join(racine,'package.json'),'utf8'));
  const attendues=Object.keys({...manifeste.dependencies,...manifeste.devDependencies});
  const manquantes=attendues.filter(nom=>
    !fs.existsSync(path.join(racine,'node_modules',nom,'package.json')));

  if(manquantes.length){
    console.error(`\n  Dépendances manquantes : ${manquantes.join(', ')}`);
    console.error('  Elles ont été ajoutées depuis ta dernière installation.\n');
    console.error('     npm install\n');
    console.error('  puis relance la commande.\n');
    process.exit(1);
  }
}catch{
  // Un imprévu ici ne doit jamais empêcher de travailler.
}
