import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { FavoritesService, FavoriteItem, FavoriteStats } from '../shared/services/favorites.service';

@Component({
  selector: 'app-my-favorites',
  templateUrl: './my-favorites.component.html',
  styleUrls: ['./my-favorites.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
})
export class MyFavoritesComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  favorites: FavoriteItem[] = [];
  filteredFavorites: FavoriteItem[] = [];
  favoriteStats: FavoriteStats = {
    totalFavorites: 0,
    articleCount: 0,
    doctorCount: 0,
    toolCount: 0,
    tipCount: 0
  };

  // UI State
  isLoading = false;
  searchTerm = '';
  selectedCategory = 'all';
  selectedSort = 'recent';
  showEmptyState = false;

  // Filter options
  categories = [
    { value: 'all', label: 'All Items', icon: 'apps' },
    { value: 'article', label: 'Articles', icon: 'document-text' },
    { value: 'doctor', label: 'Doctors', icon: 'medical' },
    { value: 'tool', label: 'Tools', icon: 'construct' },
    { value: 'tip', label: 'Tips', icon: 'bulb' }
  ];

  sortOptions = [
    { value: 'recent', label: 'Most Recent' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'alphabetical', label: 'A-Z' },
    { value: 'type', label: 'By Type' }
  ];

  private favoritesService = inject(FavoritesService);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);
  public router = inject(Router);

  ngOnInit() {
    this.loadFavorites();
    this.loadStats();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadFavorites() {
    this.isLoading = true;
    this.favoritesService.getFavorites()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (favorites) => {
          this.favorites = favorites;
          this.applyFilters();
          this.showEmptyState = favorites.length === 0;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading favorites:', error);
          this.showToast('Failed to load favorites', 'danger');
          this.isLoading = false;
        }
      });
  }

  loadStats() {
    this.favoritesService.getFavoriteStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe(stats => {
        this.favoriteStats = stats;
      });
  }

  applyFilters() {
    let filtered = [...this.favorites];

    // Apply search filter
    if (this.searchTerm.trim()) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(this.searchTerm.toLowerCase()))
      );
    }

    // Apply category filter
    if (this.selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.type === this.selectedCategory);
    }

    // Apply sorting
    switch (this.selectedSort) {
      case 'recent':
        filtered.sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime());
        break;
      case 'alphabetical':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'type':
        filtered.sort((a, b) => a.type.localeCompare(b.type));
        break;
    }

    this.filteredFavorites = filtered;
  }

  onSearchChange(event: any) {
    this.searchTerm = event.detail.value;
    this.applyFilters();
  }

  onCategoryChange(category: string) {
    this.selectedCategory = category;
    this.applyFilters();
  }

  onSortChange(event: any) {
    this.selectedSort = event.detail.value;
    this.applyFilters();
  }

  async removeFavorite(item: FavoriteItem, event?: Event) {
    if (event) {
      event.stopPropagation();
    }

    const alert = await this.alertController.create({
      header: 'Remove Favorite',
      message: `Remove "${item.title}" from your favorites?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Remove',
          role: 'destructive',
          handler: () => {
            this.favoritesService.removeFromFavorites(item.id);
            this.showToast('Removed from favorites', 'success');
          }
        }
      ]
    });

    await alert.present();
  }

  async clearAllFavorites() {
    const alert = await this.alertController.create({
      header: 'Clear All Favorites',
      message: 'Are you sure you want to remove all favorites? This action cannot be undone.',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Clear All',
          role: 'destructive',
          handler: () => {
            this.favoritesService.clearAllFavorites();
            this.showToast('All favorites cleared', 'success');
          }
        }
      ]
    });

    await alert.present();
  }

  async openFavoriteItem(item: FavoriteItem) {
    try {
      switch (item.type) {
        case 'article':
          // Navigate to article detail page
          await this.router.navigate(['/article', item.id]);
          this.showToast(`Opening article: ${item.title}`, 'success');
          break;
          
        case 'doctor':
          // Navigate to doctor profile page
          if (item.data?.id) {
            await this.router.navigate(['/doctor', item.data.id]);
            this.showToast(`Opening doctor profile: ${item.title}`, 'success');
          } else {
            // Fallback to doctors list
            await this.router.navigate(['/doctors']);
            this.showToast('Opening doctors list', 'success');
          }
          break;
          
        case 'tool':
          // Navigate to insights page with specific tool query
          await this.router.navigate(['/tabs/insights'], { 
            queryParams: { openTool: item.id } 
          });
          this.showToast(`Opening tool: ${item.title}`, 'success');
          break;
          
        case 'tip':
          // Navigate to home page where tips are displayed
          await this.router.navigate(['/tabs/home']);
          this.showToast(`Opening tip: ${item.title}`, 'success');
          break;
          
        default:
          // Generic fallback - go to home
          await this.router.navigate(['/tabs/home']);
          this.showToast('Opening content...', 'success');
          break;
      }
    } catch (error) {
      console.error('Error opening favorite item:', error);
      this.showToast('Failed to open item. Please try again.', 'danger');
    }
  }

  getTypeIcon(type: FavoriteItem['type']): string {
    const icons = {
      article: 'document-text',
      doctor: 'medical',
      tool: 'construct',
      tip: 'bulb'
    };
    return icons[type] || 'heart';
  }

  getTypeColor(type: FavoriteItem['type']): string {
    const colors = {
      article: '#3b82f6',
      doctor: '#10b981',
      tool: '#f59e0b',
      tip: '#8b5cf6'
    };
    return colors[type] || '#6b7280';
  }

  formatDate(date: Date): string {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInHours < 168) {
      const days = Math.floor(diffInHours / 24);
      return `${days}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  async showToast(message: string, color: 'success' | 'danger' | 'warning' = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }

  goBack() {
    this.router.navigate(['/tabs/home']);
  }

  trackByFavoriteId(index: number, item: FavoriteItem): string {
    return item.id;
  }
}