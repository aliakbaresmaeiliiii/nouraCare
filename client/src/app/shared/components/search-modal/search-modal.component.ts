import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { SharedModule } from '../../shared-module';

export interface SearchItem {
  text: string;
  value: any;
  [key: string]: any; // Allow additional properties
}

@Component({
  selector: 'app-search-modal',
  templateUrl: './search-modal.component.html',
  styleUrls: ['./search-modal.component.scss'],
  standalone: false
})
export class SearchModalComponent implements OnInit {
  @Input() items: SearchItem[] = [];
  @Input() selectedValue: any = null;
  @Input() title = 'Select Item';
  @Input() showCheckbox = false;

  @Output() selectionCancel = new EventEmitter<void>();
  @Output() selectionChange = new EventEmitter<any>();

  filteredItems: SearchItem[] = [];

  ngOnInit() {
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

  /**
   * Update the rendered view with
   * the provided search query. If no
   * query is provided, all data
   * will be rendered.
   */
  filterList(searchQuery: string | undefined) {
    /**
     * If no search query is defined,
     * return all options.
     */
    if (searchQuery === undefined || searchQuery.trim() === '') {
      this.filteredItems = [...this.items];
    } else {
      /**
       * Otherwise, normalize the search
       * query and check to see which items
       * contain the search query as a substring.
       */
      const normalizedQuery = searchQuery.toLowerCase();
      this.filteredItems = this.items.filter((item) =>
        item.text.toLowerCase().includes(normalizedQuery)
      );
    }
  }

  selectItem(item: SearchItem) {
    this.selectedValue = item.value;
  }

  isSelected(value: any): boolean {
    return this.selectedValue === value;
  }
}
