import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { SHARED_STANDALONE_IMPORTS } from '@app/shared/shared-standalone';

export interface SearchItem {
  text: string;
  value: any;
  [key: string]: any; // Allow additional properties
}

@Component({
  selector: 'app-search-modal',
  templateUrl: './search-modal.component.html',
  styleUrls: ['./search-modal.component.scss'],
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS],
})
export class SearchModalComponent implements OnInit {
  private _items: SearchItem[] = [];
  
  @Input() set items(value: SearchItem[]) {
    this._items = value || [];
    this.updateFilteredItems();
  }
  
  get items(): SearchItem[] {
    return this._items;
  }
  
  @Input() selectedValue: any = null;
  @Input() title = 'Select Item';
  @Input() showCheckbox = false;

  @Output() selectionCancel = new EventEmitter<void>();
  @Output() selectionChange = new EventEmitter<any>();

  filteredItems: SearchItem[] = [];

  ngOnInit() {
    this.updateFilteredItems();
  }

  private updateFilteredItems() {
    this.filteredItems = [...this.items];
  }

  cancelChanges() {
    this.selectionCancel.emit();
  }

  confirmChanges() {
    this.selectionChange.emit(this.selectedValue);
  }

  searchbarInput(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    this.filterList(inputElement.value);
  }

  selectItem(item: SearchItem) {
    this.selectedValue = item.value;
  }

  isSelected(value: any): boolean {
    return this.selectedValue === value;
  }

  filterList(searchQuery: string | undefined) {
    if (searchQuery === undefined || searchQuery.trim() === '') {
      this.filteredItems = [...this.items];
    } else {
      const normalizedQuery = searchQuery.toLowerCase();
      this.filteredItems = this.items.filter((item) =>
        item.text.toLowerCase().includes(normalizedQuery)
      );
    }
  }
}
