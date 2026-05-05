import { Concept } from '../types';
import { CONCEPTS_PART1 } from './concepts-part1';
import { CONCEPTS_PART2 } from './concepts-part2';
import { CONCEPTS_MESSAGING } from './concepts-messaging';
import { CONCEPTS_CLOUD_NETWORK } from './concepts-cloud-network';
import { CONCEPTS_CLOUD_DELIVERY } from './concepts-cloud-delivery';
import { CONCEPTS_CLOUD_PLATFORM } from './concepts-cloud-platform';

export const CONCEPTS: Concept[] = [
  ...CONCEPTS_PART1,
  ...CONCEPTS_PART2,
  ...CONCEPTS_MESSAGING,
  ...CONCEPTS_CLOUD_NETWORK,
  ...CONCEPTS_CLOUD_DELIVERY,
  ...CONCEPTS_CLOUD_PLATFORM,
];
