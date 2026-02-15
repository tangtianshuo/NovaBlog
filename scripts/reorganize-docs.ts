import fs from 'fs/promises';
import path from 'path';

const DOCUMENTS_DIR = path.join(process.cwd(), 'data', 'documents');

async function reorganizeDocuments() {
  const files = await fs.readdir(DOCUMENTS_DIR);
  
  for (const file of files) {
    const filePath = path.join(DOCUMENTS_DIR, file);
    const stat = await fs.stat(filePath);
    
    if (stat.isDirectory()) continue;
    if (!file.endsWith('.md')) continue;
    if (file.startsWith('.')) continue;
    
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      
      const match = content.match(/^---\n([\s\S]*?)\n---/);
      if (!match) {
        console.log(`Skipping ${file}: No front matter found`);
        continue;
      }
      
      const frontMatter = match[1];
      const statusMatch = frontMatter.match(/status:\s*(\w+)/);
      const status = statusMatch ? statusMatch[1] : 'draft';
      const titleMatch = frontMatter.match(/title:\s*["']?([^"'\n]+)["']?/);
      const title = titleMatch ? titleMatch[1].trim() : file.replace('.md', '');
      
      const sanitizedTitle = title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
      
      const targetDir = path.join(DOCUMENTS_DIR, status);
      const targetFolder = path.join(targetDir, sanitizedTitle);
      const targetFile = path.join(targetFolder, 'index.md');
      
      await fs.mkdir(targetFolder, { recursive: true });
      
      await fs.writeFile(targetFile, content);
      console.log(`Moved ${file} -> ${targetFile}`);
      
      await fs.unlink(filePath);
    } catch (error) {
      console.error(`Error processing ${file}:`, error);
    }
  }
  
  console.log('Reorganization complete!');
}

reorganizeDocuments().catch(console.error);
