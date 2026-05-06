import { Concept } from '../types';
import { CONCEPTS_PART1 } from './concepts-part1';
import { CONCEPTS_PART2 } from './concepts-part2';
import { CONCEPTS_MESSAGING } from './concepts-messaging';
import { CONCEPTS_CLOUD_NETWORK } from './concepts-cloud-network';
import { CONCEPTS_CLOUD_DELIVERY } from './concepts-cloud-delivery';
import { CONCEPTS_CLOUD_PLATFORM } from './concepts-cloud-platform';
import { CONCEPTS_NETWORKING } from './concepts-networking';
import { CONCEPTS_OSI } from './concepts-osi';
import { CONCEPTS_PROTOCOLS } from './concepts-protocols';
import { CONCEPTS_KUBERNETES } from './concepts-kubernetes';
import { CONCEPTS_AWS_CONTAINERS } from './concepts-aws-containers';

export const CONCEPTS: Concept[] = [
  ...CONCEPTS_PART1,
  ...CONCEPTS_PART2,
  ...CONCEPTS_MESSAGING,
  ...CONCEPTS_CLOUD_NETWORK,
  ...CONCEPTS_CLOUD_DELIVERY,
  ...CONCEPTS_CLOUD_PLATFORM,
  ...CONCEPTS_NETWORKING,
  ...CONCEPTS_OSI,
  ...CONCEPTS_PROTOCOLS,
  ...CONCEPTS_KUBERNETES,
  ...CONCEPTS_AWS_CONTAINERS,
];
