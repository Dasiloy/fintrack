'use client';

import { useState, useMemo, useCallback } from 'react';

import { SUPPORT_ARTICLES } from '../_data';
import { SupportHero } from './support_hero';
import { CategoriesGrid } from './categories_grid';
import { PopularArticles } from './popular_articles';
import { SearchResults } from './search_results';
import { ContactCta } from './contact_cta';

export function SupportHub() {
  const [query, setQuery] = useState('');

  const handleQueryChange = useCallback((v: string) => setQuery(v), []);

  const trimmedQuery = query.trim().toLowerCase();
  const isSearching = trimmedQuery.length > 0;

  const searchResults = useMemo(() => {
    if (!isSearching) return [];
    return SUPPORT_ARTICLES.filter(
      (a) =>
        a.title.toLowerCase().includes(trimmedQuery) ||
        a.excerpt.toLowerCase().includes(trimmedQuery),
    );
  }, [trimmedQuery, isSearching]);

  return (
    <>
      <SupportHero query={query} onQueryChange={handleQueryChange} />

      {isSearching ? (
        <SearchResults articles={searchResults} query={query.trim()} />
      ) : (
        <>
          <CategoriesGrid />
          <PopularArticles />
          <ContactCta />
        </>
      )}
    </>
  );
}
