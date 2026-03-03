import { TEAM_MEMBERS } from '../_data';

/**
 * "Meet the Makers" section — team member cards with initials avatar.
 *
 * Avatars use gradient backgrounds derived from the design system primary
 * colour so no external image hosting is required.
 */
export function MeetTheTeam() {
  return (
    <section className="mx-auto mb-24 max-w-[1200px] px-4 md:px-6">
      <div className="mx-auto mb-14 max-w-2xl text-center">
        <h2 className="font-manrope text-text-primary mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
          Meet the Makers
        </h2>
        <p className="text-body text-text-secondary leading-relaxed">
          A small, focused team united by a passion for beautiful and useful software.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {TEAM_MEMBERS.map(({ name, role, bio, initials }) => (
          <div
            key={name}
            className="group rounded-card bg-bg-elevated border-border-subtle hover:bg-bg-surface-hover hover:border-border-light border p-8 text-center transition-all duration-smooth"
          >
            {/* Avatar */}
            <div
              aria-hidden="true"
              className="from-primary/40 to-primary/10 text-text-primary font-manrope mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-linear-to-br text-lg font-bold"
            >
              {initials}
            </div>

            <h3 className="text-h4 font-manrope text-text-primary mb-1 font-bold">{name}</h3>
            <p className="text-body-sm text-primary mb-3 font-medium">{role}</p>
            <p className="text-body-sm text-text-secondary leading-relaxed">{bio}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
