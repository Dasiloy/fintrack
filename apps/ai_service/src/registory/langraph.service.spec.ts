import { LangraphService } from './langraph.service';
import { AdvisorAction, GraphStreamEvent } from './lang.types';

describe('LangraphService', () => {
  describe('streamEvents', () => {
    it('emits approval_required when an action interrupt is streamed', async () => {
      const action: AdvisorAction = {
        kind: 'adjust_budget',
        budgetId: 'budget-1',
        categorySlug: 'food',
        currentLimit: 40000,
        proposedLimit: 42000,
        reason: 'Food spending is trending above the current budget.',
      };
      const graph = {
        stream: jest.fn(async function* () {
          yield [
            'updates',
            {
              __interrupt__: [
                {
                  value: {
                    kind: 'action',
                    action,
                  },
                },
              ],
            },
          ];
        }),
      };

      const service = new LangraphService();

      const events: GraphStreamEvent<unknown>[] = [];
      for await (const event of service.streamEvents(graph as never, {})) {
        events.push(event);
      }

      expect(events).toEqual([{ type: 'approval_required', action }]);
    });
  });
});
