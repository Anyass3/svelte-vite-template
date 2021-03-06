// @ts-check

/** This script modifies the project to support TS code in .svelte files like:

  <script lang="ts">
  	export let name: string;
  </script>
 
  As well as validating the code for CI.
  */

/**  To work on this script:
  rm -rf test-template template && git clone sveltejs/template test-template && node scripts/setupTypeScript.js test-template
*/

const fs = require('fs');
const path = require('path');
const { argv } = require('process');

const projectRoot = argv[2] || path.join(__dirname, '..');

// Add deps to pkg.json
const packageJSON = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
packageJSON.devDependencies = Object.assign(packageJSON.devDependencies, {
  'svelte-check': '^1.0.0',
  'svelte-preprocess': '^4.0.0',
  typescript: '^4.0.0',
  tslib: '^2.0.0',
  '@tsconfig/svelte': '^1.0.0',
});

// Add script for checking
packageJSON.scripts = Object.assign(packageJSON.scripts, {
  validate: 'svelte-check',
});

// Write the package JSON
fs.writeFileSync(path.join(projectRoot, 'package.json'), JSON.stringify(packageJSON, null, '  '));

// change the index html to ts
const indexFile = path.join(projectRoot, 'index.html');
const indexFileData = fs.readFileSync(indexFile, 'utf8');
const indexFileResult = indexFileData.replace('main.js', 'main.ts');
fs.writeFileSync(indexFile, indexFileResult, 'utf8');

// mv src/main.js to main.ts - note, we need to edit vite.config.js for this too
const beforeMainJSPath = path.join(projectRoot, 'src', 'main.js');
const afterMainTSPath = path.join(projectRoot, 'src', 'main.ts');
fs.renameSync(beforeMainJSPath, afterMainTSPath);

// Switch the app.svelte file to use TS
const appSveltePath = path.join(projectRoot, 'src', 'App.svelte');
let appFile = fs.readFileSync(appSveltePath, 'utf8');
appFile = appFile.replace('<script>', '<script lang="ts">');
appFile = appFile.replace('export let name;', 'export let name: string;');
fs.writeFileSync(appSveltePath, appFile);

// Edit vite config
const viteConfigPath = path.join(projectRoot, 'vite.config.js');
let viteConfig = fs.readFileSync(viteConfigPath, 'utf8');

// Edit imports
viteConfig = viteConfig.replace(
  `'@svitejs/vite-plugin-svelte';`,
  `'@svitejs/vite-plugin-svelte';
import sveltePreprocess from 'svelte-preprocess';`
);

// // Replace name of entry point
// viteConfig = viteConfig.replace(`'src/main.js'`, `'src/main.ts'`)

// Add preprocessor
viteConfig = viteConfig.replace(
  'emitCss: true,',
  `emitCss: true,
  preprocess: sveltePreprocess({ sourceMap: !production }),`
);

// // Add TypeScript
// viteConfig = viteConfig.replace(
//   'commonjs(),',
//   'commonjs(),\n\t\ttypescript({\n\t\t\tsourceMap: !production,\n\t\t\tinlineSources: !production\n\t\t}),'
// );
fs.writeFileSync(viteConfigPath, viteConfig);

// Add TSConfig
const tsconfig = `{
  "extends": "@tsconfig/svelte/tsconfig.json",

  "include": ["src/**/*"],
  "exclude": ["node_modules/*", "__sapper__/*", "public/*","build/*"]
}`;
const tsconfigPath = path.join(projectRoot, 'tsconfig.json');
fs.writeFileSync(tsconfigPath, tsconfig);

// Delete this script, but not during testing
if (!argv[2]) {
  // Remove the script
  fs.unlinkSync(path.join(__filename));

  // Check for Mac's DS_store file, and if it's the only one left remove it
  const remainingFiles = fs.readdirSync(path.join(__dirname));
  if (remainingFiles.length === 1 && remainingFiles[0] === '.DS_store') {
    fs.unlinkSync(path.join(__dirname, '.DS_store'));
  }

  // Check if the scripts folder is empty
  if (fs.readdirSync(path.join(__dirname)).length === 0) {
    // Remove the scripts folder
    fs.rmdirSync(path.join(__dirname));
  }
}

// Adds the extension recommendation
fs.mkdirSync(path.join(projectRoot, '.vscode'), { recursive: true });
fs.writeFileSync(
  path.join(projectRoot, '.vscode', 'extensions.json'),
  `{
  "recommendations": ["svelte.svelte-vscode"]
}
`
);

console.log('Converted to TypeScript.');

if (fs.existsSync(path.join(projectRoot, 'node_modules'))) {
  console.log(
    "\nYou will need to re-run your dependency manager to get started.\nfor example if using npm: 'npm install'"
  );
}
