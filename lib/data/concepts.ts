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
import { CONCEPTS_DESIGN_PATTERNS } from './concepts-design-patterns';
import { CONCEPTS_ARCH_PATTERNS } from './concepts-arch-patterns';
import { CONCEPTS_REDIS } from './concepts-redis';
import { CONCEPTS_POSTGRES } from './concepts-postgres';
import { CONCEPTS_AWS_SERVICES } from './concepts-aws-services';
import { CONCEPTS_DSA } from './concepts-dsa';
import { CONCEPTS_GIT } from './concepts-git';
import { CONCEPTS_GHA } from './concepts-gha';
import { CONCEPTS_MONGODB } from './concepts-mongodb';
import { CONCEPTS_POSTGRES_ADVANCED } from './concepts-postgres-advanced';
import { CONCEPTS_OOP } from './concepts-oop';
import { CONCEPTS_SOLID } from './concepts-solid';

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
  ...CONCEPTS_DESIGN_PATTERNS,
  ...CONCEPTS_ARCH_PATTERNS,
  ...CONCEPTS_REDIS,
  ...CONCEPTS_POSTGRES,
  ...CONCEPTS_AWS_SERVICES,
  ...CONCEPTS_DSA,
  ...CONCEPTS_GIT,
  ...CONCEPTS_GHA,
  ...CONCEPTS_MONGODB,
  ...CONCEPTS_POSTGRES_ADVANCED,
  ...CONCEPTS_OOP,
  ...CONCEPTS_SOLID,
];
