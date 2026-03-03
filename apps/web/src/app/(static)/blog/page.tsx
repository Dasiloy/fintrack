import { StaticPageShell } from '@/app/(static)/_components';
import { BlogHub, NewsletterCta } from './_components';

export const metadata = {
  title: 'Blog — FinTrack',
  description:
    'Budgeting tips, investing guides, product updates, and real success stories from the FinTrack team and community.',
};

export default function BlogPage() {
  return (
    <StaticPageShell>
      <BlogHub />
      <NewsletterCta />
    </StaticPageShell>
  );
}
