import fs from 'fs/promises';
import path from 'path';

const DOCUMENTS_DIR = path.join(process.cwd(), 'data', 'documents');

async function processMarkdownGuide() {
  const filePath = path.join(DOCUMENTS_DIR, 'markdown-guide.md');
  
  try {
    let content = await fs.readFile(filePath, 'utf-8');
      
    const frontMatterRegex = /^---\r?\n([\s\S]*?)\r?\n---/;
    const match = content.match(frontMatterRegex);
    
    if (!match) {
      console.log(`Skipping markdown-guide.md: No front matter found`);
      console.log('File content preview:', content.substring(0, 200));
      return;
    }
    
    const frontMatter = match[1];
    const statusMatch = frontMatter.match(/status:\s*(\w+)/);
    const status = statusMatch ? statusMatch[1] : 'published';
    const titleMatch = frontMatter.match(/title:\s*["']?([^"'\r\n]+)["']?/);
    const title = titleMatch ? titleMatch[1].trim() : 'Markdown Guide';
    
    const sanitizedTitle = title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    
    const targetDir = path.join(DOCUMENTS_DIR, status);
    const targetFolder = path.join(targetDir, sanitizedTitle);
    const targetFile = path.join(targetFolder, 'index.md');
    
    await fs.mkdir(targetFolder, { recursive: true });
    
    await fs.writeFile(targetFile, content);
    console.log(`Moved markdown-guide.md -> ${targetFile}`);
    
    await fs.unlink(filePath);
  } catch (error) {
    console.error(`Error processing markdown-guide.md:`, error);
  }
}

processMarkdownGuide().catch(console.error);
