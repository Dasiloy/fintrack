jest.mock('@fintrack/utils/date', () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock('@fintrack/utils/format', () => ({
  formatCurrency: (value: number) => `₦${value}`,
  slugToName: (slug: string) => slug,
}));
jest.mock('@fintrack/database/service', () => ({
  PrismaService: class PrismaService {},
}));

import { createAdvisorTools, PROPOSE_ACTION_TOOL_NAME } from './advisor.tools';
import { toJsonSchema } from '@langchain/core/utils/json_schema';
import { AdvisorActionSchema } from './advisor.tools';

describe('createAdvisorTools', () => {
  it('includes an inert propose_action tool that accepts advisor actions', async () => {
    const tools = createAdvisorTools({} as never);
    const proposeAction = tools.find(
      (tool) => tool.name === PROPOSE_ACTION_TOOL_NAME,
    ) as { invoke(input: unknown): Promise<string> } | undefined;

    expect(proposeAction).toBeDefined();
    await expect(
      proposeAction!.invoke({
        kind: 'adjust_budget',
        budgetId: 'budget-1',
        categorySlug: 'food',
        currentLimit: 40000,
        proposedLimit: 42000,
        reason: 'Food spending is trending above the current budget.',
      }),
    ).resolves.toContain('Proposal captured');
  });

  it('keeps the propose_action schema compatible with Gemini function declarations', () => {
    const schemaJson = JSON.stringify(toJsonSchema(AdvisorActionSchema));

    expect(schemaJson).not.toContain('"const"');
  });

  it('still validates required fields for each action kind', () => {
    const result = AdvisorActionSchema.safeParse({
      kind: 'adjust_budget',
      budgetId: 'budget-1',
      reason: 'Food is over budget.',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path.join('.'))).toEqual(
        expect.arrayContaining([
          'categorySlug',
          'currentLimit',
          'proposedLimit',
        ]),
      );
    }
  });
});
