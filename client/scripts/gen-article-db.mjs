import fs from 'fs';

const src = fs.readFileSync('src/app/article-detail/article-detail.component.ts', 'utf8');
const match = src.match(/private articleDatabase[^=]*=\s*(\{[\s\S]*?\n  \});/);
if (!match) {
  console.error('Could not parse articleDatabase');
  process.exit(1);
}
const db = Function(`return ${match[1]}`)();
const out = `/** Sample article bodies (EN) for article detail. */\nexport const ARTICLE_DATABASE_EN: Record<string, import('../article-detail/article.types').ArticleContent> = ${JSON.stringify(db, null, 2)};\n`;
fs.mkdirSync('src/app/shared/content', { recursive: true });
fs.writeFileSync('src/app/shared/content/article-database.en.content.ts', out);
console.log('articles', Object.keys(db).join(', '));
