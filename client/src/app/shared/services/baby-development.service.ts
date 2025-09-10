import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface BabySizeData {
  week: number;
  size: string;
  weight: string;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class BabyDevelopmentService {
  private readonly storageKey = 'babySizeData';
  private readonly apiEndpoint = `${environment.apiEndPoint}baby-development`;

  // Signal to store baby size data
  private babySizeData = signal<BabySizeData[]>([]);
  
  // Computed signal for current baby size based on pregnancy week
  currentBabySize = computed(() => {
    const data = this.babySizeData();
    const pregnancyWeek = this.getCurrentPregnancyWeek();
    return this.getBabySizeForWeek(pregnancyWeek);
  });

  constructor(private http: HttpClient) {
    this.loadBabySizeData();
  }

  /**
   * Get baby size data for a specific week
   */
  getBabySizeForWeek(week: number): BabySizeData | null {
    const data = this.babySizeData();
    return data.find(item => item.week === week) || null;
  }

  /**
   * Get all baby size data
   */
  getAllBabySizeData(): BabySizeData[] {
    return this.babySizeData();
  }

  /**
   * Get current baby size based on user's pregnancy week
   */
  getCurrentBabySize(): BabySizeData | null {
    return this.currentBabySize();
  }

  /**
   * Load baby size data from localStorage or API
   */
  private loadBabySizeData(): void {
    // First try to load from localStorage
    const localData = this.loadFromStorage();
    if (localData.length > 0) {
      this.babySizeData.set(localData);
      console.log('Baby size data loaded from localStorage');
      return;
    }

    // If no local data, load from API or use default data
    this.loadFromApiOrDefault();
  }

  /**
   * Load data from localStorage
   */
  private loadFromStorage(): BabySizeData[] {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading baby size data from localStorage:', error);
      return [];
    }
  }

  /**
   * Load data from API or use default data
   */
  private loadFromApiOrDefault(): void {
    // Try to load from API first
    this.loadFromApi().subscribe({
      next: (data) => {
        this.babySizeData.set(data);
        this.saveToStorage(data);
        console.log('Baby size data loaded from API');
      },
      error: (error) => {
        console.log('API not available, using default baby size data');
        this.loadDefaultData();
      }
    });
  }

  /**
   * Load data from API
   */
  private loadFromApi(): Observable<BabySizeData[]> {
    return this.http.get<BabySizeData[]>(this.apiEndpoint).pipe(
      catchError((error) => {
        console.error('Error loading baby size data from API:', error);
        throw error;
      })
    );
  }

  /**
   * Load default baby size data
   */
  private loadDefaultData(): void {
    const defaultData: BabySizeData[] = [
      { week: 4, size: 'Poppy Seed 🌱', weight: '0.04g', description: 'Tiny as a poppy seed' },
      { week: 5, size: 'Sesame Seed 🌱', weight: '0.1g', description: 'Small as a sesame seed' },
      { week: 6, size: 'Lentil 🌱', weight: '0.2g', description: 'Size of a lentil' },
      { week: 7, size: 'Blueberry 🫐', weight: '1g', description: 'Sweet as a blueberry' },
      { week: 8, size: 'KidneyBean 🫘', weight: '3g', description: 'Shaped like a kidney bean' },
      { week: 9, size: 'Grape 🍇', weight: '7g', description: 'Plump as a grape' },
      { week: 10, size: 'Kumquat 🍊', weight: '14g', description: 'Citrusy kumquat size' },
      { week: 11, size: 'Fig 🫒', weight: '25g', description: 'Sweet fig size' },
      { week: 12, size: 'Lime 🍋', weight: '45g', description: 'Zesty lime size' },
      { week: 13, size: 'Peach 🍑', weight: '70g', description: 'Soft peach size' },
      { week: 14, size: 'Lemon 🍋', weight: '100g', description: 'Bright lemon size' },
      { week: 15, size: 'Apple 🍎', weight: '150g', description: 'Crisp apple size' },
      { week: 16, size: 'Avocado 🥑', weight: '200g', description: 'Creamy avocado size' },
      { week: 17, size: 'Pear 🍐', weight: '250g', description: 'Sweet pear size' },
      { week: 18, size: 'BellPepper 🫑', weight: '300g', description: 'Colorful bell pepper' },
      { week: 19, size: 'Mango 🥭', weight: '400g', description: 'Tropical mango size' },
      { week: 20, size: 'Banana 🍌', weight: '500g', description: 'Banana length' },
      { week: 21, size: 'Carrot 🥕', weight: '600g', description: 'Carrot length' },
      { week: 22, size: 'Coconut 🥥', weight: '700g', description: 'Coconut size' },
      { week: 23, size: 'Grapefruit 🍊', weight: '800g', description: 'Grapefruit size' },
      { week: 24, size: 'Corn 🌽', weight: '900g', description: 'Corn cob length' },
      { week: 25, size: 'Cauliflower 🥦', weight: '1kg', description: 'Cauliflower size' },
      { week: 26, size: 'Lettuce 🥬', weight: '1.2kg', description: 'Lettuce head size' },
      { week: 27, size: 'Broccoli 🥦', weight: '1.4kg', description: 'Broccoli size' },
      { week: 28, size: 'Eggplant 🍆', weight: '1.6kg', description: 'Eggplant size' },
      { week: 29, size: 'ButternutSquash 🎃', weight: '1.8kg', description: 'Squash size' },
      { week: 30, size: 'Cabbage 🥬', weight: '2kg', description: 'Cabbage size' },
      { week: 31, size: 'Pineapple 🍍', weight: '2.2kg', description: 'Pineapple size' },
      { week: 32, size: 'Squash 🎃', weight: '2.4kg', description: 'Large squash' },
      { week: 33, size: 'HoneydewMelon 🍈', weight: '2.6kg', description: 'Melon size' },
      { week: 34, size: 'Cantaloupe 🍈', weight: '2.8kg', description: 'Cantaloupe size' },
      { week: 35, size: 'Honeydew 🍈', weight: '3kg', description: 'Honeydew melon' },
      { week: 36, size: 'RomaineLettuce 🥬', weight: '3.2kg', description: 'Romaine size' },
      { week: 37, size: 'SwissChard 🥬', weight: '3.4kg', description: 'Swiss chard size' },
      { week: 38, size: 'Leek 🧅', weight: '3.6kg', description: 'Leek length' },
      { week: 39, size: 'MiniWatermelon 🍉', weight: '3.8kg', description: 'Mini watermelon' },
      { week: 40, size: 'Watermelon 🍉', weight: '4kg', description: 'Full watermelon size' }
    ];

    this.babySizeData.set(defaultData);
    this.saveToStorage(defaultData);
  }

  /**
   * Save data to localStorage
   */
  private saveToStorage(data: BabySizeData[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving baby size data to localStorage:', error);
    }
  }

  /**
   * Get current pregnancy week from localStorage
   */
  private getCurrentPregnancyWeek(): number {
    try {
      const cycleSettings = localStorage.getItem('cycleSettings');
      if (cycleSettings) {
        const data = JSON.parse(cycleSettings);
        return data.pregnancyWeek || 12; // Default to week 12
      }
    } catch (error) {
      console.error('Error getting pregnancy week from localStorage:', error);
    }
    return 12; // Default fallback
  }

  /**
   * Refresh data from API (for future updates)
   */
  refreshFromApi(): Observable<BabySizeData[]> {
    return this.loadFromApi().pipe(
      tap((data) => {
        this.babySizeData.set(data);
        this.saveToStorage(data);
        console.log('Baby size data refreshed from API');
      })
    );
  }

  /**
   * Clear all data (for logout)
   */
  clearData(): void {
    localStorage.removeItem(this.storageKey);
    this.babySizeData.set([]);
  }
}
