export interface WordItem {
  id: number;
  word: string;
  mean: string;
  same: string[];
  trans_word: string;
  example1: string;
  example2: string;
}

export type RewardType = 'A' | 'B' | 'C' | '';

export interface PersonalWord {
  id: string;
  spelling: string;
  meanings: string[];
}