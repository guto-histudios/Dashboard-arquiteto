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
  { regex: /text-text-main-sec/g, replacement: 'text-text-sec' },
  { regex: /text-text-main-main/g, replacement: 'text-text-main' },
  { regex: /border-border-subtle-subtle/g, replacement: 'border-border-subtle' },
  { regex: /bg-bg-sec-hover/g, replacement: 'bg-bg-main' },
];

walkDir('./src', (filePath) => {
  let content = fs.readFileSync(filePath, 'utf-8');
  let original = content;
  
  for (const { regex, replacement } of replacements) {
    content = content.replace(regex, replacement);
  }
  
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Fixed ${filePath}`);
  }
});
