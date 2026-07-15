import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CategoryCardComponent } from '@components/categories/category-card/category-card.component';
import { Category } from '@models/category';
import { CategoriesService } from '@services/categories.service';
import { normalizeStringForSearch } from '@utils/score-filtering';
import { PluralizePipe } from '@utils/pluralize.pipe';

@Component({
  selector: 'app-list-categories',
  imports: [
    FormsModule,
    RouterLink,
    CategoryCardComponent,
    PluralizePipe,
  ],
  templateUrl: './list-categories.component.html',
  styleUrl: './list-categories.component.scss'
})
export class ListCategoriesComponent {
  private readonly categoriesService = inject(CategoriesService);

  categories: Category[] = this.categoriesService.getAll();
  searchText: string = '';

  get rootCategories(): Category[] {
    const normalizedSearch = normalizeStringForSearch(this.searchText);
    return this.categories.filter(category =>
      category.isRoot &&
      (normalizedSearch.length === 0 || this.matchesCategoryTree(category, normalizedSearch))
    );
  }

  private matchesCategoryTree(category: Category, normalizedSearch: string): boolean {
    if (category.searchableName.includes(normalizedSearch)) {
      return true;
    }

    return category.children.some(child => this.matchesCategoryTree(child, normalizedSearch));
  }
}
