export class CreateForumCategoryDto {
  name: string;
  description: string;
  slug: string;
  color?: string;
  icon?: string;
  order?: number;
  isActive?: boolean;
}
