import { Concept } from '../types';
import { CONCEPTS_PART1 } from './concepts-part1';
import { CONCEPTS_PART2 } from './concepts-part2';
import { CONCEPTS_MESSAGING } from './concepts-messaging';

export const CONCEPTS: Concept[] = [
  ...CONCEPTS_PART1,
  ...CONCEPTS_PART2,
  ...CONCEPTS_MESSAGING,
];
