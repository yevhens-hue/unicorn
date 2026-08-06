const AICosAgentService = require('../src/services/AICosAgentService');
const AIVoiceCallService = require('../src/services/AIVoiceCallService');

describe('AICosAgentService & Voice AI Booker Tests', () => {
  test('runAutonomousOptimizationCycle should execute decision cycle cleanly', async () => {
    const summary = await AICosAgentService.runAutonomousOptimizationCycle();
    expect(summary).toBeDefined();
    expect(summary.status).toBe('SUCCESS');
    expect(summary.actionsTaken).toBeInstanceOf(Array);
    expect(summary.recommendedFloorPrice).toBeGreaterThanOrEqual(135);
  });

  test('getAgentState should return active rules and configuration', () => {
    const state = AICosAgentService.getAgentState();
    expect(state.agentName).toContain('Chief of Staff');
    expect(state.status).toBe('ACTIVE_MONITORING');
    expect(state.rules.length).toBeGreaterThan(0);
  });

  test('getObjectionResponse should handle common homeowner objections', () => {
    const res1 = AIVoiceCallService.getObjectionResponse('IS_THIS_FREE', { name: 'Alice', zipCode: '75001' });
    expect(res1).toContain('100% free with zero obligation');

    const res2 = AIVoiceCallService.getObjectionResponse('ARE_YOU_A_MIDDLEMAN', { name: 'Bob', zipCode: '75001' });
    expect(res2).toContain('direct regional scheduling hub');

    const res3 = AIVoiceCallService.getObjectionResponse('WHY_NEED_ADDRESS', { name: 'Charlie', zipCode: '75001' });
    expect(res3).toContain('satellite roof-mapping technology');
  });
});
