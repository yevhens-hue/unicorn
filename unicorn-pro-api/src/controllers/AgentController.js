const AICosAgentService = require('../services/AICosAgentService');
const AIVoiceCallService = require('../services/AIVoiceCallService');

class AgentController {
  /**
   * Triggers autonomous AI COS optimization cycle.
   */
  static async runCosCycle(req, res) {
    try {
      const summary = await AICosAgentService.runAutonomousOptimizationCycle();
      res.json(summary);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Returns current AI COS Agent state and rules.
   */
  static getCosStatus(req, res) {
    try {
      const state = AICosAgentService.getAgentState();
      res.json(state);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Tests AI Voice Booker objection handling response.
   */
  static testObjection(req, res) {
    try {
      const { objectionType, lead } = req.body;
      const responseScript = AIVoiceCallService.getObjectionResponse(objectionType || 'IS_THIS_FREE', lead || {});
      res.json({
        objectionType: objectionType || 'IS_THIS_FREE',
        aiVoiceResponse: responseScript,
        provider: 'Bland.ai / Retell AI Agent',
        status: 'READY'
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = AgentController;
