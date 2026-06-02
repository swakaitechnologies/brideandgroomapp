/**
 * Automates replacing `fontWeight: "xxx"` with `...fonts.yyy` in all .tsx files
 * under src/screens and src/components, and adds the fonts import if missing.
 *
 * Run: node scripts/apply-quicksand.js
 */

const fs = require('fs');
const path = require('path');

const SRC = path.resolve(__dirname, '..', 'src');

// fontWeight value => fonts.xxx spread name
const WEIGHT_MAP = {
  "'300'": 'fonts.light',
  '"300"': 'fonts.light',
  "'light'": 'fonts.light',
  '"light"': 'fonts.light',

  "'400'": 'fonts.regular',
  '"400"': 'fonts.regular',
  "'normal'": 'fonts.regular',
  '"normal"': 'fonts.regular',

  "'500'": 'fonts.medium',
  '"500"': 'fonts.medium',
  "'medium'": 'fonts.medium',
  '"medium"': 'fonts.medium',

  "'600'": 'fonts.semibold',
  '"600"': 'fonts.semibold',
  "'semibold'": 'fonts.semibold',
  '"semibold"': 'fonts.semibold',

  "'700'": 'fonts.semibold',
  '"700"': 'fonts.semibold',
  "'bold'": 'fonts.semibold',
  '"bold"': 'fonts.semibold',

  "'800'": 'fonts.bold',
  '"800"': 'fonts.bold',

  "'900'": 'fonts.bold',
  '"900"': 'fonts.bold',
};

function walkDir(dir, exts, results = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(full, exts, results);
    } else if (exts.some(e => entry.name.endsWith(e))) {
      results.push(full);
    }
  }
  return results;
}

let totalChanges = 0;

const files = [
  ...walkDir(path.join(SRC, 'screens'), ['.tsx', '.ts']),
  ...walkDir(path.join(SRC, 'components'), ['.tsx', '.ts']),
];

for (const file of files) {
  let code = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Replace fontWeight: "xxx" with ...fonts.yyy
  // Match patterns like:  fontWeight: "700",  or  fontWeight: '500',
  const regex = /(\s*)fontWeight:\s*(['"][^'"]+['"])\s*,?/g;
  const newCode = code.replace(regex, (match, indent, value) => {
    const mapped = WEIGHT_MAP[value];
    if (mapped) {
      changed = true;
      // Check if line ends with comma
      const hasComma = match.trimEnd().endsWith(',');
      return `${indent}...${mapped}${hasComma ? ',' : ''}`;
    }
    return match; // leave unchanged if we don't recognize the value
  });

  if (changed) {
    let finalCode = newCode;

    // Add fonts import if not already present
    if (!finalCode.includes("from \"@/src/theme\"") && !finalCode.includes("from '@/src/theme'")) {
      // Try to insert after the last import line
      const importLines = finalCode.split('\n');
      let lastImportIdx = -1;
      for (let i = 0; i < importLines.length; i++) {
        if (importLines[i].match(/^import\s/) || importLines[i].match(/^\s*\}\s*from\s/)) {
          lastImportIdx = i;
        }
      }
      if (lastImportIdx >= 0) {
        importLines.splice(lastImportIdx + 1, 0, 'import { fonts } from "@/src/theme";');
        finalCode = importLines.join('\n');
      }
    } else if (finalCode.includes("from \"@/src/theme\"") || finalCode.includes("from '@/src/theme'")) {
      // Make sure fonts is in the import
      const themeImportRegex = /import\s*\{([^}]*)\}\s*from\s*["']@\/src\/theme["']/;
      const themeMatch = finalCode.match(themeImportRegex);
      if (themeMatch && !themeMatch[1].includes('fonts')) {
        const existingImports = themeMatch[1].trim();
        const newImports = existingImports ? `${existingImports}, fonts` : 'fonts';
        finalCode = finalCode.replace(themeImportRegex, `import { ${newImports} } from "@/src/theme"`);
      }
    }

    fs.writeFileSync(file, finalCode, 'utf8');
    totalChanges++;
    console.log(`✅ ${path.relative(SRC, file)}`);
  }
}

console.log(`\nDone! Updated ${totalChanges} files.`);
