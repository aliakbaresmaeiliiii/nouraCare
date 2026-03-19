import { CUSTOM_ELEMENTS_SCHEMA, Component, OnInit, inject } from '@angular/core';
import { SHARED_STANDALONE_IMPORTS } from '../shared/shared-standalone';
import { Router } from '@angular/router';

interface SavedItem {
  id: number;
  title: string;
  description: string;
  category: string;
  imageUrl?: string;
  savedAt: string;
  type: 'article' | 'tip' | 'resource' | 'video';
  readTime?: number;
  author?: string;
}

@Component({
  selector: 'app-saved-information',
  templateUrl: './saved-information.component.html',
  styleUrls: ['./saved-information.component.scss'],
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class SavedInformationComponent implements OnInit {
  private router = inject(Router);
  
  savedItems: SavedItem[] = [];
  isLoading = false;
  errorMessage = '';
  selectedCategory = 'all';
  searchQuery = '';

  categories = [
    { value: 'all', label: 'All', icon: 'grid-outline' },
    { value: 'article', label: 'Articles', icon: 'document-text-outline' },
    { value: 'tip', label: 'Tips', icon: 'bulb-outline' },
    { value: 'resource', label: 'Resources', icon: 'library-outline' },
    { value: 'video', label: 'Videos', icon: 'play-circle-outline' }
  ];

  constructor() { }

  ngOnInit() {
    this.loadSavedItems();
  }

  loadSavedItems() {
    this.isLoading = true;
    this.errorMessage = '';
    
    // TODO: Replace with actual API call when backend is ready
    // this.savedService.getSavedItems().subscribe({
    //   next: (response: any) => {
    //     this.savedItems = response.data || [];
    //     this.isLoading = false;
    //   },
    //   error: (error: any) => {
    //     console.error('Error loading saved items:', error);
    //     this.errorMessage = 'Failed to load saved items. Please try again.';
    //     this.isLoading = false;
    //   }
    // });

    // Mock data for now
    setTimeout(() => {
      this.savedItems = [
        {
          id: 1,
          title: 'Understanding Your Menstrual Cycle',
          description: 'A comprehensive guide to tracking and understanding your menstrual cycle phases.',
          category: 'article',
          imageUrl: 'assets/images/heart.png',
          savedAt: '2024-01-15T10:30:00Z',
          type: 'article',
          readTime: 5,
          author: 'Dr. Sarah Johnson'
        },
        {
          id: 2,
          title: 'Natural Remedies for Period Pain',
          description: 'Effective home remedies and natural treatments for menstrual cramps.',
          category: 'tip',
          imageUrl: 'assets/images/heart.png',
          savedAt: '2024-01-14T14:20:00Z',
          type: 'tip',
          readTime: 3,
          author: 'Health Expert'
        },
        {
          id: 3,
          title: 'Pregnancy Nutrition Guide',
          description: 'Essential nutrients and diet tips for a healthy pregnancy.',
          category: 'resource',
          imageUrl: 'assets/images/heart.png',
          savedAt: '2024-01-13T09:15:00Z',
          type: 'resource',
          readTime: 8,
          author: 'Nutrition Specialist'
        },
        {
          id: 4,
          title: 'Yoga for Women\'s Health',
          description: 'Gentle yoga poses specifically designed for women\'s reproductive health.',
          category: 'video',
          imageUrl: 'assets/images/heart.png',
          savedAt: '2024-01-12T16:45:00Z',
          type: 'video',
          readTime: 15,
          author: 'Yoga Instructor'
        }
      ];
      this.isLoading = false;
    }, 1000);
  }

  onCategoryChange(category: string | number) {
    this.selectedCategory = category.toString();
  }

  onSearchChange(event: any) {
    this.searchQuery = event.detail.value || '';
  }

  removeSavedItem(itemId: number) {
    // TODO: Replace with actual API call when backend is ready
    // this.savedService.removeSavedItem(itemId).subscribe({
    //   next: (response: any) => {
    //     this.showSuccessAlert('Item removed from saved list');
    //     this.loadSavedItems();
    //   },
    //   error: (error: any) => {
    //     console.error('Error removing saved item:', error);
    //     this.showErrorAlert('Failed to remove item. Please try again.');
    //   }
    // });

    // Mock removal for now
    this.savedItems = this.savedItems.filter(item => item.id !== itemId);
    this.showSuccessAlert('Item removed from saved list');
  }

  openItem(item: SavedItem) {
    // TODO: Navigate to the actual content page
    console.log('Opening item:', item);
  }

  get filteredItems(): SavedItem[] {
    let items = this.savedItems;
    
    // Filter by category
    if (this.selectedCategory !== 'all') {
      items = items.filter(item => item.category === this.selectedCategory);
    }
    
    // Filter by search query
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      items = items.filter(item => 
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.author?.toLowerCase().includes(query)
      );
    }
    
    return items;
  }

  getCategoryIcon(category: string): string {
    const cat = this.categories.find(c => c.value === category);
    return cat?.icon || 'document-outline';
  }

  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Unknown date';
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Unknown date';
    }
  }

  goBack() {
    this.router.navigate(['/tabs']);
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.src = 'assets/images/heart.png';
    }
  }

  private showSuccessAlert(message: string): void {
    const successDialog = document.createElement('div');
    successDialog.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4CAF50;
      color: white;
      padding: 16px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 300px;
      animation: slideIn 0.3s ease-out;
    `;

    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);

    const messageElement = document.createElement('div');
    messageElement.innerHTML = `✅ ${message}`;
    messageElement.style.cssText = `
      font-size: 14px;
      font-weight: 500;
    `;

    successDialog.appendChild(messageElement);
    document.body.appendChild(successDialog);

    setTimeout(() => {
      if (successDialog.parentNode) {
        successDialog.remove();
      }
    }, 3000);
  }

  private showErrorAlert(message: string): void {
    const errorDialog = document.createElement('div');
    errorDialog.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #f44336;
      color: white;
      padding: 16px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 300px;
      animation: slideIn 0.3s ease-out;
    `;

    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);

    const messageElement = document.createElement('div');
    messageElement.innerHTML = `❌ ${message}`;
    messageElement.style.cssText = `
      font-size: 14px;
      font-weight: 500;
    `;

    errorDialog.appendChild(messageElement);
    document.body.appendChild(errorDialog);

    setTimeout(() => {
      if (errorDialog.parentNode) {
        errorDialog.remove();
      }
    }, 5000);
  }
}
