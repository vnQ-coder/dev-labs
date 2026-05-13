'use client';
import { useMemo } from 'react';
import FlowDiagram, { mkNode, mkEdge, mkLabel, mkGroup } from './FlowDiagram';
import type { Node, Edge } from '@xyflow/react';

export default function NestJSTestingDiagram() {
  const nodes: Node[] = useMemo(() => [
    // Unit test group
    mkGroup('grp-unit', 0, 0, 720, 130, { label: 'Unit Test — Test.createTestingModule()', color: '#38bdf8' }),
    mkNode('test-module',  20,  40, { icon: '🧪', title: 'Test.createTestingModule()', sub: 'providers: [UserService, mockRepo]',    color: '#38bdf8', badge: 'setup' }),
    mkNode('mock-repo',   240,  40, { icon: '🤖', title: 'Mock UserRepository',        sub: '{ provide: UserRepository, useValue: mockRepo }', color: '#64748b', badge: 'useValue' }),
    mkNode('user-svc',    460,  40, { icon: '⚙️', title: 'UserService',               sub: 'Real service with mocked dependencies', color: '#38bdf8', badge: 'under test' }),
    mkNode('verify',      600,  40, { icon: '✅', title: 'Verify Calls',              sub: 'expect(mockRepo.save).toHaveBeenCalledWith(dto)', color: '#10b981', badge: 'assertion' }),

    // Mock chain group
    mkGroup('grp-chain', 0, 155, 720, 110, { label: 'Mocking Chain — inject → call → verify', color: '#a78bfa' }),
    mkNode('test-call',   20, 192, { icon: '📞', title: 'userService.create(dto)',    sub: 'test invokes the method under test',    color: '#a78bfa', badge: 'act' }),
    mkNode('svc-delegates',200,192, { icon: '🔀', title: 'UserService.create()',      sub: 'calls this.userRepository.save(entity)', color: '#38bdf8', badge: 'SUT calls mock' }),
    mkNode('mock-save',   420, 192, { icon: '💾', title: 'mockRepo.save()',           sub: 'jest.fn() returns mocked result',       color: '#64748b', badge: 'mock intercepts' }),
    mkNode('result',      590, 192, { icon: '📊', title: 'Return + Assert',           sub: 'assert result + verify mock calls',      color: '#10b981', badge: 'assert' }),

    // E2E group
    mkGroup('grp-e2e', 0, 290, 720, 110, { label: 'E2E Test — INestApplication + supertest', color: '#f97316' }),
    mkNode('nest-app',    20, 328, { icon: '🚀', title: 'INestApplication',          sub: 'app = await NestFactory.create(AppModule)', color: '#f97316', badge: 'full app' }),
    mkNode('supertest',  200, 328, { icon: '🔬', title: 'supertest(app.getHttpServer())', sub: 'HTTP layer without a real port',     color: '#f97316', badge: 'test HTTP' }),
    mkNode('e2e-req',    420, 328, { icon: '🌐', title: 'HTTP Request',              sub: '.post("/users").send(body).expect(201)', color: '#64748b', badge: 'request' }),
    mkNode('e2e-resp',   590, 328, { icon: '✅', title: 'Assert Response',           sub: 'status code, body shape, headers',       color: '#10b981', badge: 'e2e assertion' }),

    mkLabel('lbl', 80, 420, { label: 'Unit: mock dependencies. E2E: spin up full app, hit real HTTP routes.', icon: '💡', color: '#64748b' }),
  ], []);

  const edges: Edge[] = useMemo(() => [
    // Unit test
    mkEdge('e-tm-mock',   'test-module',    'mock-repo',      { color: '#64748b', labelText: 'overrides' }),
    mkEdge('e-tm-svc',    'test-module',    'user-svc',       { color: '#38bdf8', labelText: 'provides' }),
    mkEdge('e-svc-verify','user-svc',       'verify',         { color: '#10b981', dashed: true }),

    // Mock chain
    mkEdge('e-tc-sd',     'test-call',      'svc-delegates',  { color: '#a78bfa', labelText: 'calls' }),
    mkEdge('e-sd-mock',   'svc-delegates',  'mock-save',      { color: '#64748b', labelText: 'delegated to mock' }),
    mkEdge('e-mock-res',  'mock-save',      'result',         { color: '#10b981', labelText: 'returns' }),

    // E2E
    mkEdge('e-app-super', 'nest-app',       'supertest',      { color: '#f97316', labelText: 'getHttpServer()' }),
    mkEdge('e-super-req', 'supertest',      'e2e-req',        { color: '#64748b', labelText: 'sends' }),
    mkEdge('e-req-resp',  'e2e-req',        'e2e-resp',       { color: '#10b981', labelText: 'assert' }),
  ], []);

  return <FlowDiagram nodes={nodes} edges={edges} />;
}
