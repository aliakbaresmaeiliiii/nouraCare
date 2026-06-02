import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { TranslatePipe } from '../../pipes/translate.pipe';

export interface PostCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}

@Component({
  selector: 'app-category-selection-modal',
  templateUrl: './category-selection-modal.component.html',
  styleUrls: ['./category-selection-modal.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, TranslatePipe]
})
export class CategorySelectionModalComponent implements OnInit {

  private modalController = inject(ModalController);

  selectedCategory: PostCategory | null = null;

  // Categories matching the image
  categories: PostCategory[] = [
    {
      id: 'trying-to-conceive',
      name: 'Trying to conceive',
      description: 'Questions and support for conception journey'
    },
    {
      id: 'pregnancy-tests',
      name: 'Pregnancy tests',
      description: 'Testing experiences and questions'
    },
    {
      id: 'ovulation',
      name: 'Ovulation',
      description: 'Tracking and understanding ovulation'
    },
    {
      id: 'pregnancy',
      name: 'Pregnancy',
      description: 'General pregnancy discussions'
    },
    {
      id: '1st-trimester',
      name: '1st trimester',
      description: 'First trimester experiences and questions'
    },
    {
      id: '2nd-trimester',
      name: '2nd trimester',
      description: 'Second trimester discussions'
    },
    {
      id: '3rd-trimester',
      name: '3rd trimester',
      description: 'Third trimester experiences'
    },
    {
      id: 'parenthood',
      name: 'Parenthood',
      description: 'Life with your little one'
    },
    {
      id: 'postpartum',
      name: 'Postpartum',
      description: 'Recovery and postpartum life'
    },
    {
      id: 'relationships',
      name: 'Relationships',
      description: 'Partner and family relationships'
    }
  ];

  ngOnInit() {
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