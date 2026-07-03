'use client';

import * as React from 'react';
import { cn } from '@ui/lib/utils';
import { isActionableRecommendation, parseAdvisorTextBlocks } from '../_lib/advisor.helpers';

interface RichTextProps {
  text: string;
  onRecommendationClick?: (recommendation: string) => void;
}

export function RichText({ text, onRecommendationClick }: RichTextProps) {
  const blocks = parseAdvisorTextBlocks(text);

  return (
    <>
      {blocks.map((block, blockIndex) => {
        const spacing = blockIndex > 0 ? 'mt-2' : '';
        switch (block.kind) {
          case 'heading':
            return (
              <p
                key={blockIndex}
                className={cn(
                  'text-text-primary text-[13px] font-semibold',
                  blockIndex > 0 && 'mt-3',
                )}
              >
                <RichInlineText text={block.text} onRecommendationClick={onRecommendationClick} />
              </p>
            );
          case 'bullet':
            return (
              <ul key={blockIndex} className={cn('space-y-1', spacing)}>
                {block.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="flex gap-2">
                    <span className="bg-text-disabled mt-[7px] size-1 shrink-0 rounded-full" />
                    <span>
                      <RichInlineText text={item} onRecommendationClick={onRecommendationClick} />
                    </span>
                  </li>
                ))}
              </ul>
            );
          case 'numbered':
            return (
              <ol key={blockIndex} className={cn('space-y-1', spacing)}>
                {block.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="flex gap-2">
                    <span className="text-text-tertiary shrink-0 tabular-nums">
                      {itemIndex + 1}.
                    </span>
                    <span>
                      <RichInlineText text={item} onRecommendationClick={onRecommendationClick} />
                    </span>
                  </li>
                ))}
              </ol>
            );
          default:
            return (
              <p key={blockIndex} className={spacing}>
                {block.lines.map((line, lineIndex) => (
                  <React.Fragment key={lineIndex}>
                    {lineIndex > 0 && <br />}
                    <RichInlineText text={line} onRecommendationClick={onRecommendationClick} />
                  </React.Fragment>
                ))}
              </p>
            );
        }
      })}
    </>
  );
}

export function RichInlineText({ text, onRecommendationClick }: RichTextProps) {
  const displayText = text.replace(/#{1,6}\s+/g, '');
  const parts = displayText.split(/(\*\*[^*]+\*\*|\+\+[^+]+\+\+|==[^=]+==|`[^`]+`|\*[^*\n]+\*)/g);

  return (
    <>
      {parts.map((part, index) => {
        if (!part) return null;
        if (part.startsWith('**') && part.endsWith('**')) {
          const label = part.slice(2, -2);
          const clickable = Boolean(onRecommendationClick && isActionableRecommendation(label));
          if (clickable) {
            return (
              <button
                key={index}
                type="button"
                onClick={() => onRecommendationClick?.(label)}
                className="text-primary decoration-primary/30 hover:text-primary/80 hover:decoration-primary focus-visible:ring-primary/30 cursor-pointer rounded-sm text-left font-semibold underline underline-offset-2 transition-colors focus-visible:ring-2 focus-visible:outline-none"
                title="Ask advisor to do this recommendation"
              >
                {label}
              </button>
            );
          }
          return (
            <strong key={index} className="text-primary font-semibold">
              {label}
            </strong>
          );
        }

        if (part.startsWith('++') && part.endsWith('++')) {
          return (
            <strong key={index} className="text-success font-semibold">
              {part.slice(2, -2)}
            </strong>
          );
        }

        if (part.startsWith('==') && part.endsWith('==')) {
          return (
            <strong key={index} className="text-warning font-semibold">
              {part.slice(2, -2)}
            </strong>
          );
        }

        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code
              key={index}
              className="bg-bg-elevated text-text-primary rounded px-1 py-0.5 font-mono text-[12px]"
            >
              {part.slice(1, -1)}
            </code>
          );
        }

        if (part.startsWith('*') && part.endsWith('*')) {
          return (
            <em key={index} className="italic">
              {part.slice(1, -1)}
            </em>
          );
        }

        return <React.Fragment key={index}>{highlightAmounts(part, index)}</React.Fragment>;
      })}
    </>
  );
}

function highlightAmounts(text: string, keyPrefix: number): React.ReactNode {
  const parts = text.split(/(₦[\d,]+(?:\.\d+)?)/g);
  return parts.map((part, index) =>
    /^₦[\d,]/.test(part) ? (
      <span key={`${keyPrefix}-${index}`} className="text-text-primary font-semibold">
        {part}
      </span>
    ) : (
      <React.Fragment key={`${keyPrefix}-${index}`}>{part}</React.Fragment>
    ),
  );
}
