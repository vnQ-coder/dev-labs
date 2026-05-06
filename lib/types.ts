export interface Category {
  id: string;
  label: string;
  color: string;
}

export interface ConceptComponent {
  name: string;
  icon: string;
  role: string;
  detail: string;
}

export interface DecisionCriteria {
  choose: string[];
  avoid: string[];
  vs: Array<{ name: string; when: string }>;
}

export interface FailureMode {
  name: string;
  cause: string;
  symptom: string;
  fix: string;
  severity: 'critical' | 'high' | 'medium';
}

export interface ConceptAnalogy {
  v: string;
  t: string;
  tx: string;
  s: string;
}

export interface ConceptTechnical {
  def: string;
  types: Array<{ n: string; d: string }>;
  when: string;
  trade: string;
  code?: string;
  rw: {
    ex: string[];
    cs: string;
  };
}

export interface ConceptInterview {
  q: string;
  a: string;
  fu: string[];
}

export interface PipelineStep {
  label: string;
  sublabel?: string;
  icon: string;
  simple: string;
  deep: string;
}

export interface DebugCommand {
  label: string;
  cmd: string;
  what: string;
}

export interface Concept {
  id: string;
  cat: string;
  color: string;
  icon: string;
  title: string;
  tag: string;
  overview?: string;
  components?: ConceptComponent[];
  howItWorks?: string;
  decision?: DecisionCriteria;
  failures?: FailureMode[];
  a: ConceptAnalogy;
  te: ConceptTechnical;
  interview: ConceptInterview;
  // Behind the Scenes journey fields
  hook?: string;
  simpleExplain?: string;
  pipeline?: PipelineStep[];
  commands?: DebugCommand[];
}

export interface NFReq {
  label: string;
  value: string;
}

export interface ScaleEst {
  label: string;
  value: string;
  note?: string;
}

export interface DesignStep {
  title: string;
  description: string;
}

export interface DeepDiveItem {
  title: string;
  description: string;
  insight?: string;
}

export interface DesignDecision {
  question: string;
  chosen: string;
  reason: string;
}

export interface InterviewQA {
  q: string;
  a: string;
}

export interface RealWorldSystem {
  id: string;
  icon: string;
  name: string;
  color: string;
  scale: string;
  focus: string;
  problem: string;
  functionalReqs: string[];
  nonFunctionalReqs: NFReq[];
  scaleEstimation: ScaleEst[];
  highLevelDesign: DesignStep[];
  deepDive: DeepDiveItem[];
  decisions: DesignDecision[];
  interview: InterviewQA[];
  keyInsight: string;
}

export interface QuizQuestion {
  q: string;
  opts: string[];
  ans: number;
  exp: string;
  conceptId?: string;
}
