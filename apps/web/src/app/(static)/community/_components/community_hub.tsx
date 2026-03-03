'use client';

import { useState, useMemo, useCallback } from 'react';

import { DISCUSSIONS } from '../_data';
import { CommunityHero } from './community_hero';
import { TopicCategories } from './topic_categories';
import { CommunityFeed } from './community_feed';

const PAGE_SIZE = 3;

/**
 * Client-side orchestrator for the Community Hub.
 *
 * Manages two pieces of interactive state:
 *   1. `query`        — search string typed in the hero input
 *   2. `visibleCount` — how many discussions are shown (increments on Load More)
 *
 * Both pieces of state are derived here and passed down as props, keeping
 * the individual section components lean and focused on presentation.
 */
export function CommunityHub() {
  const [query, setQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Reset pagination whenever the query changes
  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    setVisibleCount(PAGE_SIZE);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return DISCUSSIONS;
    return DISCUSSIONS.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.excerpt.toLowerCase().includes(q) ||
        d.tag.toLowerCase().includes(q) ||
        d.authorName.toLowerCase().includes(q),
    );
  }, [query]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const handleLoadMore = useCallback(() => {
    setVisibleCount((c) => c + PAGE_SIZE);
  }, []);

  return (
    <>
      <CommunityHero query={query} onQueryChange={handleQueryChange} />
      <TopicCategories />
      <CommunityFeed
        discussions={visible}
        hasMore={hasMore}
        onLoadMore={handleLoadMore}
        isFiltered={!!query.trim()}
      />
    </>
  );
}
