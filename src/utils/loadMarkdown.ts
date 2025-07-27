import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';
import { marked } from 'marked';

export interface MarkdownArticle {
  html: string;
  frontmatter: {
    title: string;
    description: string;
    pubDate: string;
    author: string;
  };
}

export async function loadMarkdownArticle(slug: string): Promise<MarkdownArticle | null> {
  try {
    const articlesDir = fileURLToPath(new URL('../content/articles/', import.meta.url));
    const filePath = path.join(articlesDir, `${slug}.md`);
    console.log('[DEBUG] Trying to read:', filePath);

    const fileContent = await fs.readFile(filePath, 'utf-8');

    const { data, content } = matter(fileContent);
    const html = marked(content);

    return {
      html,
      frontmatter: {
        title: data.title,
        description: data.description,
        pubDate: data.pubDate,
        author: data.author,
      },
    };
  } catch (error) {
    console.error(`Failed to load article: ${slug}`, error);
    return null;
  }
}
