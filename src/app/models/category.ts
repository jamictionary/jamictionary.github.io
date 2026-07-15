import { normalizeStringForSearch } from '@utils/score-filtering';
import { Score } from './score';
import { Searchable } from './searchable';

export class Category implements Searchable {
  name: string;
  searchableName: string;
  scores: Score[];
  children: Category[] = [];
  redirectTo?: string;
  isCollapsed: boolean = false;
  isRoot: boolean;

  constructor(
    name: string,
    scores: Score[] = [],
    children: Category[] = [],
    isRoot: boolean = true,
    redirectTo?: string,
  ) {
    this.name = name;
    this.searchableName = normalizeStringForSearch(name);
    this.scores = scores;
    this.children = children;
    this.isRoot = isRoot;
    this.redirectTo = redirectTo;
  }

  get numberOfScores(): number {
    return this.scores.length;
  }

  get totalScores(): number {
    return this.scores.length + this.children.reduce((sum, child) => sum + child.totalScores, 0);
  }

  get isNotEmpty(): boolean {
    return this.totalScores > 0;
  }

  get hasChildren(): boolean {
    return this.children.length > 0;
  }
}
