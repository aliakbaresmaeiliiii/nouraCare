import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface FavoriteItem {
  id: string;
  type: 'article' | 'doctor' | 'tool' | 'tip';
  title: string;
  description?: string;
  image?: string;
  category?: string;
  gradient?: string;
  data?: any; // Additional data specific to the item type
  dateAdded: Date;
}

export interface FavoriteStats {
  totalFavorites: number;
  articleCount: number;
  doctorCount: number;
  toolCount: number;
  tipCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {
  private readonly STORAGE_KEY = 'user_favorites';
  private favoritesSubject = new BehaviorSubject<FavoriteItem[]>([]);
  public favorites$ = this.favoritesSubject.asObservable();

  constructor() {
    this.loadFavorites();
  }

  // Load favorites from localStorage
  private loadFavorites(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const favorites = JSON.parse(stored).map((item: any) => ({
          ...item,
          dateAdded: new Date(item.dateAdded)
        }));
        this.favoritesSubject.next(favorites);
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  }

  // Save favorites to localStorage
  private saveFavorites(favorites: FavoriteItem[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(favorites));
      this.favoritesSubject.next(favorites);
    } catch (error) {
      console.error('Error saving favorites:', error);
    }
  }

  // Get all favorites
  getFavorites(): Observable<FavoriteItem[]> {
    return this.favorites$;
  }

  // Get favorites by type
  getFavoritesByType(type: FavoriteItem['type']): Observable<FavoriteItem[]> {
    return new Observable(observer => {
      this.favorites$.subscribe(favorites => {
        observer.next(favorites.filter(item => item.type === type));
      });
    });
  }

  // Get favorite statistics
  getFavoriteStats(): Observable<FavoriteStats> {
    return new Observable(observer => {
      this.favorites$.subscribe(favorites => {
        const stats: FavoriteStats = {
          totalFavorites: favorites.length,
          articleCount: favorites.filter(item => item.type === 'article').length,
          doctorCount: favorites.filter(item => item.type === 'doctor').length,
          toolCount: favorites.filter(item => item.type === 'tool').length,
          tipCount: favorites.filter(item => item.type === 'tip').length
        };
        observer.next(stats);
      });
    });
  }

  // Check if item is favorite
  isFavorite(id: string): Observable<boolean> {
    return new Observable(observer => {
      this.favorites$.subscribe(favorites => {
        observer.next(favorites.some(item => item.id === id));
      });
    });
  }

  // Add item to favorites
  addToFavorites(item: Omit<FavoriteItem, 'dateAdded'>): void {
    const currentFavorites = this.favoritesSubject.value;
    
    // Check if already exists
    if (currentFavorites.some(fav => fav.id === item.id)) {
      return; // Already in favorites
    }

    const newFavorite: FavoriteItem = {
      ...item,
      dateAdded: new Date()
    };

    const updatedFavorites = [...currentFavorites, newFavorite];
    this.saveFavorites(updatedFavorites);
  }

  // Remove item from favorites
  removeFromFavorites(id: string): void {
    const currentFavorites = this.favoritesSubject.value;
    const updatedFavorites = currentFavorites.filter(item => item.id !== id);
    this.saveFavorites(updatedFavorites);
  }

  // Toggle favorite status
  toggleFavorite(item: Omit<FavoriteItem, 'dateAdded'>): void {
    const currentFavorites = this.favoritesSubject.value;
    const existingIndex = currentFavorites.findIndex(fav => fav.id === item.id);

    if (existingIndex >= 0) {
      this.removeFromFavorites(item.id);
    } else {
      this.addToFavorites(item);
    }
  }

  // Clear all favorites
  clearAllFavorites(): void {
    this.saveFavorites([]);
  }

  // Clear favorites by type
  clearFavoritesByType(type: FavoriteItem['type']): void {
    const currentFavorites = this.favoritesSubject.value;
    const updatedFavorites = currentFavorites.filter(item => item.type !== type);
    this.saveFavorites(updatedFavorites);
  }

  // Search favorites
  searchFavorites(query: string): Observable<FavoriteItem[]> {
    return new Observable(observer => {
      this.favorites$.subscribe(favorites => {
        const filtered = favorites.filter(item => 
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          (item.description && item.description.toLowerCase().includes(query.toLowerCase())) ||
          (item.category && item.category.toLowerCase().includes(query.toLowerCase()))
        );
        observer.next(filtered);
      });
    });
  }

  // Get recent favorites (last 10)
  getRecentFavorites(limit: number = 10): Observable<FavoriteItem[]> {
    return new Observable(observer => {
      this.favorites$.subscribe(favorites => {
        const sorted = [...favorites].sort((a, b) => 
          new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
        );
        observer.next(sorted.slice(0, limit));
      });
    });
  }
}
