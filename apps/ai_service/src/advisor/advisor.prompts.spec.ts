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

  it('keeps list and show requests read-only unless the user asks for a change', () => {
    const prompt = buildAdvisorSystemPrompt(['RECURRING' as never]);
    const content = prompt.content.toString();

    expect(content).toContain(
      'Do not call propose_action for read-only requests',
    );
    expect(content).toContain('list, show, explain, summarize');
    expect(content).toContain('unless the user explicitly asks');
  });

  it('tells the model to copy exact category slugs from read tools', () => {
    const prompt = buildAdvisorSystemPrompt(['RECURRING' as never]);
    const content = prompt.content.toString();

    expect(content).toContain(
      'copy the exact categorySlug returned by a read tool',
    );
    expect(content).toContain('cat-bills-utilities');
  });

  it('marks actionable recommendations in accent highlights for the UI', () => {
    const prompt = buildAdvisorSystemPrompt(['RECURRING' as never]);
    const content = prompt.content.toString();

    expect(content).toContain(
      'Wrap the short actionable recommendation phrase in **...**',
    );
  });
});
