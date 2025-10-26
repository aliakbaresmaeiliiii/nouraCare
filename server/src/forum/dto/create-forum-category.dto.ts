export class CreateForumCategoryDto {
  id:string;
  name: string;
  description: string;
  slug: string;
  color?: string;
  icon?: string;
  order?: number;
  isActive?: boolean;
}
