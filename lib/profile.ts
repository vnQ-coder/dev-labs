// lib/profile.ts
export const PROFILE_KEY = 'axiom-profile-v1';
export const PATH_KEY = 'axiom-path-v1';

export interface UserProfile {
  name: string;
  currentStack: string[];
  targetStack: string[];
  targetRole: string;
  backgroundText: string;
  createdAt: string;
}

export interface PathConcept {
  conceptId: string;
  isSkillGap: boolean;
}

export interface PathPhase {
  label: string;
  color: string;
  concepts: PathConcept[];
}

export interface LearningPath {
  generatedAt: string;
  targetRole: string;
  phases: PathPhase[];
  totalConcepts: number;
}

export const TARGET_ROLES = [
  'Backend Engineer',
  'DevOps Engineer',
  'Full Stack Engineer',
  'Staff / Principal SWE',
  'Cloud / Infrastructure Engineer',
  'SRE',
] as const;

export type TargetRole = typeof TARGET_ROLES[number];

/** Fallback paths used when Gemini returns invalid JSON */
export const FALLBACK_PATHS: Record<string, LearningPath> = {
  'Backend Engineer': {
    generatedAt: new Date().toISOString(),
    targetRole: 'Backend Engineer',
    totalConcepts: 11,
    phases: [
      {
        label: 'Phase 1 — Foundations',
        color: '#10b981',
        concepts: [
          { conceptId: 'monolith', isSkillGap: false },
          { conceptId: 'apigateway', isSkillGap: false },
          { conceptId: 'loadbalancer', isSkillGap: true },
          { conceptId: 'caching', isSkillGap: true },
        ],
      },
      {
        label: 'Phase 2 — Scalability',
        color: '#f59e0b',
        concepts: [
          { conceptId: 'databases', isSkillGap: true },
          { conceptId: 'sharding', isSkillGap: true },
          { conceptId: 'messagequeue', isSkillGap: true },
          { conceptId: 'ratelimit', isSkillGap: true },
        ],
      },
      {
        label: 'Phase 3 — Interview Prep',
        color: '#f87171',
        concepts: [
          { conceptId: 'cap', isSkillGap: false },
          { conceptId: 'circuit', isSkillGap: false },
          { conceptId: 'kafka', isSkillGap: true },
        ],
      },
    ],
  },
  'DevOps Engineer': {
    generatedAt: new Date().toISOString(),
    targetRole: 'DevOps Engineer',
    totalConcepts: 11,
    phases: [
      {
        label: 'Phase 1 — Foundations',
        color: '#10b981',
        concepts: [
          { conceptId: 'docker', isSkillGap: false },
          { conceptId: 'kubernetes', isSkillGap: false },
          { conceptId: 'vpc', isSkillGap: true },
        ],
      },
      {
        label: 'Phase 2 — Cloud Infrastructure',
        color: '#f59e0b',
        concepts: [
          { conceptId: 'ec2', isSkillGap: true },
          { conceptId: 'ecs', isSkillGap: true },
          { conceptId: 'eks', isSkillGap: true },
          { conceptId: 'iam', isSkillGap: true },
          { conceptId: 'rds', isSkillGap: false },
        ],
      },
      {
        label: 'Phase 3 — Interview Prep',
        color: '#f87171',
        concepts: [
          { conceptId: 'loadbalancer', isSkillGap: false },
          { conceptId: 'ratelimit', isSkillGap: false },
          { conceptId: 'circuit', isSkillGap: true },
        ],
      },
    ],
  },
};

/** Default fallback for roles not in FALLBACK_PATHS */
export function getFallbackPath(role: string): LearningPath {
  return FALLBACK_PATHS[role] ?? FALLBACK_PATHS['Backend Engineer'];
}

export function loadProfile(): UserProfile | null {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(PROFILE_KEY) : null;
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch {
    return null;
  }
}

export function saveProfile(p: UserProfile): void {
  try { localStorage.setItem(PROFILE_KEY, JSON.stringify(p)); } catch {}
}

export function loadPath(): LearningPath | null {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(PATH_KEY) : null;
    return raw ? (JSON.parse(raw) as LearningPath) : null;
  } catch {
    return null;
  }
}

export function savePath(p: LearningPath): void {
  try { localStorage.setItem(PATH_KEY, JSON.stringify(p)); } catch {}
}
