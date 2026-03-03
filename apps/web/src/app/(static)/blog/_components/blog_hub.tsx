'use client';

import { useState, useMemo, useCallback } from 'react';

import { BLOG_POSTS, FEATURED_POST } from '../_data';
import { BlogHero } from './blog_hero';
import { FeaturedPost } from './featured_post';
import { PostsGrid } from './posts_grid';

const PAGE_SIZE = 6;

/**
 * Client orchestrator for the blog listing page.
 * Manages search query, active category filter, and paginated visible count.
 * The featured post is always shown at top when no filter is active.
 */
export function BlogHub() {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const handleQueryChange = useCallback((v: string) => {
    setQuery(v);
    setVisibleCount(PAGE_SIZE);
  }, []);

  const handleCategoryChange = useCallback((slug: string) => {
    setActiveCategory(slug);
    setVisibleCount(PAGE_SIZE);
  }, []);

  const isFiltered = !!(query.trim() || activeCategory);

  // All non-featured posts (or all posts when filtering)
  const gridPosts = useMemo(() => {
    const base = isFiltered ? BLOG_POSTS : BLOG_POSTS.filter((p) => !p.featured);
    const q = query.trim().toLowerCase();

    return base.filter((p) => {
      const matchesCategory = !activeCategory || p.categorySlug === activeCategory;
      const matchesQuery =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.author.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [query, activeCategory, isFiltered]);

  const visible = gridPosts.slice(0, visibleCount);
  const hasMore = visibleCount < gridPosts.length;

  const handleLoadMore = useCallback(() => {
    setVisibleCount((c) => c + PAGE_SIZE);
  }, []);

  return (
    <>
      <BlogHero
        query={query}
        onQueryChange={handleQueryChange}
        activeCategory={activeCategory}
        onCategoryChange={handleCategoryChange}
      />

      {/* Featured post only when no filter is active */}
      {!isFiltered && <FeaturedPost post={FEATURED_POST} />}

      <PostsGrid
        posts={visible}
        hasMore={hasMore}
        onLoadMore={handleLoadMore}
        isFiltered={isFiltered}
      />
    </>
  );
}
