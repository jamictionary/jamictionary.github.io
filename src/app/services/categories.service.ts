import { inject, Injectable } from '@angular/core';
import { Category } from '@models/category';
import rawCategories from '@public/search-categories.json';
import { ScoresService } from './scores.service';
import { Score } from '@models/score';

// Keep synchronized with Categories class in file MetadataBuilder.cs .
export enum CategoriesOfInterest {
  Region = 'Region',
  TypeOfDance = 'Type of dance',
}

@Injectable({
  providedIn: 'root'
})
export class CategoriesService {
  private readonly categories: Category[];

  private readonly scoreService = inject(ScoresService);

  constructor() {
    this.categories = CategoriesService.buildCategories(this.scoreService);
  }

  /**
   * Gets the categories, such as An Dro, Repasseado, etc.
   * Includes the scores for each of the categories, including a category for holding all "orphan" scores.
   * @returns the categories with their scores.
   */
  getAll(): Category[] {
    return this.categories;
  }

  /**
   * Gets a specific category, by name.
   * @param categoryName The name of the category to get.
   * @returns the category, with its scores.
   */
  get(categoryName: string): Category | undefined {
    return this.categories.find(cat => cat.name == categoryName);
  }


  private static buildCategories(scoreService: ScoresService): Category[] {
    const rawCategory = rawCategories.find(cat => cat.name == CategoriesOfInterest.TypeOfDance);
    if (rawCategory === undefined) {
      throw new Error("Cannot parse metadata files.");
    }

    const scores: Score[] = scoreService.getAll();
    const rootCategoriesMap = new Map<string, Category>();
    const rootCategories: Category[] = [];
    const commaCategories: Category[] = [];

    for (const categoryName of rawCategory.values) {
      const categoryScores = scores.filter(score => score.typeOfDance == categoryName);
      const commaIndex = categoryName.indexOf(',');

      if (commaIndex === -1) {
        const existingRoot = rootCategoriesMap.get(categoryName);
        if (existingRoot) {
          existingRoot.scores = categoryScores;
          continue;
        }

        const exactCategory = new Category(categoryName, categoryScores, [], true);
        rootCategoriesMap.set(categoryName, exactCategory);
        rootCategories.push(exactCategory);
        continue;
      }

      const prefix = categoryName.slice(0, commaIndex).trim();
      const suffix = categoryName.slice(commaIndex + 1).trim();
      let rootCategory = rootCategoriesMap.get(prefix);

      if (!rootCategory) {
        rootCategory = new Category(prefix, [], [], true);
        rootCategoriesMap.set(prefix, rootCategory);
        rootCategories.push(rootCategory);
      }

      rootCategory.children.push(new Category(suffix, categoryScores, [], false, categoryName));
      commaCategories.push(new Category(categoryName, categoryScores, [], false));
    }

    const categories: Category[] = [
      ...rootCategories,
      ...commaCategories,
    ];

    const assignedScoreNumbers: number[] = categories.flatMap(cat => cat.scores.map(score => score.number));
    const unassignedScores = scores.filter(score => !assignedScoreNumbers.includes(score.number));
    categories.push(new Category('Other', unassignedScores, [], true));

    return categories;
  }
}