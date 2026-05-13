'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function FastAPIPydanticDiagram() {
  const nodes: Node[] = useMemo(() => [
    // Model validation flow group
    mkGroup('grp-validate', 0, 0, 860, 120, { label: 'Pydantic v2 Validation Flow — model_validate → validators → object', color: '#10b981' }),
    mkNode('raw-json',      20,  40, { icon: '📥', title: 'Raw JSON Body',       sub: '{ "name": "Alice", "age": 25 }',              color: '#64748b', badge: 'input' }),
    mkNode('model-validate',190, 40, { icon: '🔍', title: 'model_validate()',    sub: 'Pydantic parses + coerces types',              color: '#10b981', badge: 'v2 API' }),
    mkNode('field-val',     380, 40, { icon: '🔢', title: 'Field Validators',    sub: '@field_validator — per-field logic',          color: '#10b981', badge: '@field_validator' }),
    mkNode('model-val',     560, 40, { icon: '🏗️', title: 'Model Validators',   sub: '@model_validator(mode=after) — cross-field', color: '#10b981', badge: '@model_validator' }),
    mkNode('python-obj',    740, 40, { icon: '✅', title: 'Validated Object',    sub: 'Type-safe Python instance',                  color: '#10b981', badge: 'instance' }),

    // Field constraints group
    mkGroup('grp-field', 0, 150, 560, 110, { label: 'Field() Constraints — validation error on failure', color: '#f97316' }),
    mkNode('field-constr',  20, 188, { icon: '📐', title: 'Field() Constraints', sub: 'min_length=1, gt=0, pattern=r"^[a-z]+$"',   color: '#f97316', badge: 'Field()' }),
    mkNode('val-error',    250, 188, { icon: '❌', title: 'ValidationError',     sub: 'loc: ["name"], msg: "too short", type: "min_length"', color: '#dc2626', badge: '422 Unprocessable' }),
    mkNode('model-dump',   420, 188, { icon: '📤', title: 'model_dump()',        sub: 'Serialize back to dict/JSON for response',   color: '#10b981', badge: 'serialization' }),

    // BaseSettings group
    mkGroup('grp-settings', 580, 150, 280, 110, { label: 'BaseSettings — env var config', color: '#38bdf8' }),
    mkNode('base-settings', 590, 188, { icon: '⚙️', title: 'BaseSettings',      sub: 'class Settings(BaseSettings): DB_URL: str', color: '#38bdf8', badge: 'pydantic-settings' }),
    mkNode('env-vars',      740, 188, { icon: '🌍', title: 'Env Variables',      sub: '.env file or OS environment loaded',         color: '#64748b', badge: 'typed config' }),

    // Discriminated union group
    mkGroup('grp-union', 0, 285, 560, 110, { label: 'Discriminated Union — type field selects model', color: '#a78bfa' }),
    mkNode('disc-union',    20, 323, { icon: '🔀', title: 'Discriminated Union', sub: 'Annotated[Cat | Dog, Field(discriminator="type")]', color: '#a78bfa', badge: 'Union type' }),
    mkNode('cat-model',    230, 310, { icon: '🐱', title: 'Cat model',           sub: 'type="cat" → Cat.model_validate(data)',       color: '#a78bfa', badge: 'selected' }),
    mkNode('dog-model',    230, 355, { icon: '🐕', title: 'Dog model',           sub: 'type="dog" → Dog.model_validate(data)',       color: '#a78bfa', badge: 'selected' }),

    mkLabel('lbl', 80, 415, { label: 'Pydantic v2: field validators → model validators → typed object. model_dump() for output.', icon: '💡', color: '#64748b' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // Validation flow
    mkEdge('e-json-mv',    'raw-json',      'model-validate', { color: '#10b981', labelText: 'parsed by' }),
    mkEdge('e-mv-fv',      'model-validate','field-val',      { color: '#10b981', labelText: 'runs' }),
    mkEdge('e-fv-modv',    'field-val',     'model-val',      { color: '#10b981', labelText: 'then' }),
    mkEdge('e-modv-obj',   'model-val',     'python-obj',     { color: '#10b981', labelText: 'produces' }),

    // Field constraints
    mkEdge('e-fc-err',     'field-constr',  'val-error',      { color: '#dc2626', dashed: true, labelText: 'fails → raises' }),
    mkEdge('e-obj-dump',   'python-obj',    'model-dump',     { color: '#10b981', dashed: true, labelText: 'serialize' }),

    // Settings
    mkEdge('e-env-settings','env-vars',     'base-settings',  { color: '#38bdf8', labelText: 'loaded into' }),

    // Discriminated union
    mkEdge('e-du-cat',     'disc-union',    'cat-model',      { color: '#a78bfa', labelText: 'type=cat' }),
    mkEdge('e-du-dog',     'disc-union',    'dog-model',      { color: '#a78bfa', labelText: 'type=dog' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
