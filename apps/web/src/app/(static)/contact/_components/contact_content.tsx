import Link from 'next/link';

import { CONTACT_CHANNELS } from '../_data';

export function ContactContent() {
  return (
    <div className="mx-auto max-w-[800px] px-4 md:px-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {CONTACT_CHANNELS.map(({ icon: Icon, title, description, href, label }) => (
          <Link
            key={title}
            href={href}
            className="glass-card rounded-card group flex flex-col gap-4 p-6 transition-all duration-smooth hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="bg-primary/10 text-primary w-fit rounded-xl p-3">
              <Icon size={20} aria-hidden="true" />
            </div>
            <div className="flex-1">
              <p className="text-body-sm text-text-primary group-hover:text-primary mb-1 font-semibold transition-colors duration-smooth">
                {title}
              </p>
              <p className="text-caption text-text-secondary leading-relaxed">{description}</p>
            </div>
            <span className="text-caption text-primary font-semibold">{label} →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
