import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { SecretChatsService } from 'src/app/secret-chats/services/secret-chat';
import { PostCategory } from 'src/app/secret-chats/secret.chats.dto';


@Component({
  selector: 'app-category-selection-modal',
  templateUrl: './category-selection-modal.component.html',
  styleUrls: ['./category-selection-modal.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class CategorySelectionModalComponent implements OnInit {

  private modalController = inject(ModalController);
  private secretChatsService = inject(SecretChatsService);
  selectedCategory: PostCategory | null = null;

  // Categories matching the image
  categories = signal<PostCategory[]>([]);

  ngOnInit() {
    this.getCategories();
  }

  getCategories() {
    this.secretChatsService.getCategories().subscribe((categories: any) => {
      debugger;
      this.categories.set(categories.data)
    });
  }

  // Category selection
  selectCategory(category: PostCategory) {
    this.selectedCategory = category;
  }

  // Navigation
  async goBack() {
    await this.modalController.dismiss(null, 'back');
  }

  async confirmSelection() {
    if (this.selectedCategory) {
      await this.modalController.dismiss(this.selectedCategory, 'confirm');
    }
  }

  // Check if category is selected
  isCategorySelected(category: PostCategory): boolean {
    return this.selectedCategory?.id === category.id;
  }

  // Get icon for each category
  getCategoryIcon(categoryId: string): string {
    const iconMap: { [key: string]: string } = {
      'trying-to-conceive': 'heart',
      'pregnancy-tests': 'flask',
      'ovulation': 'calendar',
      'pregnancy': 'baby-carriage',
      '1st-trimester': 'leaf',
      '2nd-trimester': 'flower',
      '3rd-trimester': 'star',
      'parenthood': 'people',
      'postpartum': 'medical',
      'relationships': 'heart-circle'
    };

    return iconMap[categoryId] || 'bookmark';
  }
}