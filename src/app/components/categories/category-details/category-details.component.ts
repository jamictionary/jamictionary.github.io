import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Category } from '@models/category';
import { CategoriesService } from '@services/categories.service';
import { map, Observable } from 'rxjs';
import { CategoryCardComponent } from '@components/categories/category-card/category-card.component';
import { PluralizePipe } from "@utils/pluralize.pipe";

@Component({
  selector: 'app-category-details',
  imports: [
    AsyncPipe,
    RouterLink,
    CategoryCardComponent,
    PluralizePipe,
],
  templateUrl: './category-details.component.html',
  styleUrl: './category-details.component.scss'
})
export class CategoryDetailsComponent {
  private service = inject(CategoriesService);
  private route = inject(ActivatedRoute);

  categoryName$ : Observable<string | null> = this.route.paramMap.pipe(
      map(paramMap => paramMap.get('name')),
    );
  category$ : Observable<Category | undefined> = this.categoryName$.pipe(
    map(categoryName => categoryName == null
        ? undefined
        : this.service.get(categoryName)),
  );
}
