import { Injectable } from '@angular/core';
import rawMetadata from '@public/score-metadata.json';
import { ScoreGroup } from '@models/score-group';
import { Score } from '@models/score';
import { normalizeStringForSearch } from '@utils/score-filtering';

@Injectable({
  providedIn: 'root'
})
export class ScoresService {
  private readonly metadata: Score[];
  private grouped?: ScoreGroup[] = undefined;

  constructor() {
    this.metadata = rawMetadata.map(item => {
      // We have to convert the { [name: string]: string } to a Map...
      // I don't know how to use the untyped Dictionary otherwise.
      // Because it is loaded untyped from JSON.
      const convertedLabels = new Map<string, string>(Object.entries(item.labels));
      const searchableName = normalizeStringForSearch(item.name);

      const score: Score = {
        ...item,
        labels: convertedLabels,
        searchableName: searchableName
      };

return score;
      
      //const convertedLabels = new Map<string, string>(Object.entries(item.labels));
      //const searchableName: string = normalizeStringForSearch(item.name);
      //Object.assign(item, {
      //  labels: convertedLabels,
      //  searchableName: searchableName,
      // });
      //return <Score> item;
    
    });
  }

  getTotal(): number {
    return this.metadata.length;
  }

  getAll(): Score[] {
    return this.metadata;
  }

  get(scoreNumber: number): Score | undefined {
    return this.metadata.find(score => score.number === scoreNumber);
  }

  getGroupedScores(): ScoreGroup[] {
    if (this.grouped === undefined) {
      this.grouped = ScoresService.groupScores(this.getAll());
    }
    return this.grouped;
  }

  private static groupScores(scores: Score[]): ScoreGroup[] {
    // Create a base dummy node where all the Groups will hang.
    let root = new ScoreGroup("All", undefined);
    root.subGroups = [];

    // Add each score to the groups tree, one by one.
    scores.forEach(score => {
      let branch: ScoreGroup = root;

      // For each folder/category, find or add the needed branch in the tree,
      // then dive inside that branch to handle the next category.
      const allCategories = score.folderStructure;
      allCategories.forEach(category => {
        // Does it exist?
        let existing = branch.subGroups.find(branch => branch.name === category);

        // If not, we create a new one and add it.
        if (existing === undefined) {
          existing = new ScoreGroup(category, branch);
          branch.subGroups.push(existing);
        }

        // Then we dive in this branch, to take care of the next category.
        branch = existing;
      });
      // After we reached the last category, we insert the score in that final category.
      branch.scores.push(score);
    });

    // In the end we have a large tree.
    // We want to return all its branches - the set of groups.
    return root.subGroups;
  }
}
