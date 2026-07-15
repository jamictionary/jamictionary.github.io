import { Component, Input } from '@angular/core';
import { Category } from '@models/category';
import { PluralizePipe } from "@utils/pluralize.pipe";

@Component({
  selector: 'app-category-card',
  imports: [
    PluralizePipe,
  ],
  templateUrl: './category-card.component.html',
  styleUrl: './category-card.component.scss'
})
export class CategoryCardComponent {
  @Input({ required: true })
  public category!: Category;

  @Input()
  public isChild: boolean = false;
}
