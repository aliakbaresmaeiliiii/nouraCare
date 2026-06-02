export interface ArticleSection {
  type: 'paragraph' | 'heading' | 'list' | 'quote' | 'image';
  content: string;
  items?: string[];
}

export interface ArticleContent {
  id: string;
  title: string;
  category: string;
  author: string;
  publishDate: string;
  readTime: string;
  image: string;
  summary: string;
  content: ArticleSection[];
  tags: string[];
  relatedArticles: string[];
}
