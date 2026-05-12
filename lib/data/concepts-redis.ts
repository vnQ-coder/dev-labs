import { Concept } from '../types';
import { REDIS_PART1 } from './redis-part1';
import { REDIS_PART2 } from './redis-part2';

export const CONCEPTS_REDIS: Concept[] = [...REDIS_PART1, ...REDIS_PART2];
