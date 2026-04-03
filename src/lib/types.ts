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