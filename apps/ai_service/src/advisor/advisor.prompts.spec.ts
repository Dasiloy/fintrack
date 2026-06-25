jest.mock('@fintrack/database/types', () => ({}));

import { buildAdvisorSystemPrompt } from './advisor.prompts';

describe('buildAdvisorSystemPrompt', () => {
  it('instructs the model to propose concrete actions through propose_action', () => {
    const prompt = buildAdvisorSystemPrompt(['BUDGETS' as never]);
    const content = prompt.content.toString();

    expect(content).toContain('propose_action');
    expect(content).toContain('explicit approval');
  });

  it('tells the model to explain concrete evidence before proposing an action', () => {
    const prompt = buildAdvisorSystemPrompt(['RECURRING' as never]);
    const content = prompt.content.toString();

    expect(content).toContain('explain the concrete evidence first');
    expect(content).toContain('why the action is being proposed');
  });

  it('marks actionable recommendations in accent highlights for the UI', () => {
    const prompt = buildAdvisorSystemPrompt(['RECURRING' as never]);
    const content = prompt.content.toString();

    expect(content).toContain(
      'Wrap the short actionable recommendation phrase in **...**',
    );
  });
});
