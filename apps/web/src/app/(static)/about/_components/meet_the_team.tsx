import Image from 'next/image';
import Link from 'next/link';

import { TEAM_MEMBERS } from '../_data';

export function MeetTheTeam() {
  return (
    <section className="mx-auto mb-24 max-w-[1200px] px-4 md:px-6">
      <div className="mx-auto mb-14 max-w-2xl text-center">
        <h2 className="font-manrope text-text-primary mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
          The Person Behind It
        </h2>
        <p className="text-body text-text-secondary leading-relaxed">
          FinTrack is built and maintained by one person with a clear goal.
        </p>
      </div>

      <div className="mx-auto max-w-sm">
        {TEAM_MEMBERS.map(({ name, role, bio, initials, linkedIn, image }) => (
          <div
            key={name}
            className="group rounded-card bg-bg-elevated border-border-light hover:bg-bg-surface-hover duration-smooth border p-8 text-center transition-all"
          >
            {/* Avatar — photo if available, initials fallback */}
            <div className="ring-primary/20 mx-auto mb-5 size-20 overflow-hidden rounded-full ring-2">
              {image ? (
                <Image
                  src={image}
                  alt={name}
                  width={80}
                  height={80}
                  className="size-full object-cover object-top"
                  priority
                />
              ) : (
                <div className="from-primary/40 to-primary/10 text-text-primary font-manrope flex size-full items-center justify-center bg-linear-to-br text-lg font-bold">
                  {initials}
                </div>
              )}
              wsx
            </div>

            <h3 className="text-h4 font-manrope text-text-primary mb-1 font-bold">{name}</h3>
            <p className="text-body-sm text-primary mb-3 font-medium">{role}</p>
            <p className="text-body-sm text-text-secondary mb-5 leading-relaxed">{bio}</p>

            <Link
              href={linkedIn}
              target="_blank"
              rel="noopener noreferrer"
              className="text-body-sm text-text-secondary hover:text-primary duration-smooth inline-flex items-center justify-center gap-1.5 font-medium transition-colors"
            >
              <svg
                aria-hidden="true"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                <rect x="2" y="9" width="4" height="12" />
                <circle cx="4" cy="4" r="2" />
              </svg>
              LinkedIn
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
