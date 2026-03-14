import fs from 'fs';
import path from 'path';

function walkDir(dir: string, callback: (filePath: string) => void) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else if (dirPath.endsWith('.tsx') || dirPath.endsWith('.ts')) {
      callback(dirPath);
    }
  });
}

const replacements = [
  { regex: /\btext-text-muted\b/g, replacement: 'text-text-sec' },
  { regex: /\btext-text\b/g, replacement: 'text-text-main' },
  { regex: /\bbg-surface\b/g, replacement: 'bg-bg-sec' },
  { regex: /\bbg-surface-hover\b/g, replacement: 'bg-bg-main' },
  { regex: /\bbg-card\b/g, replacement: 'bg-bg-card' },
  { regex: /\bborder-border\b/g, replacement: 'border-border-subtle' },
];

walkDir('./src', (filePath) => {
  let content = fs.readFileSync(filePath, 'utf-8');
  let original = content;
  
  for (const { regex, replacement } of replacements) {
    content = content.replace(regex, replacement);
  }
  
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Updated ${filePath}`);
  }
});
