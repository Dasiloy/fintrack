'use client';

export function Mailer({ email }: { email: string }) {
  const handleEmail = (email: string) => {
    const subject = encodeURIComponent('Support Request');
    const body = encodeURIComponent('Describe your issue...');
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  };

  return (
    <button
      className="text-primary hover:text-primary-light cursor-pointer underline underline-offset-2 transition-colors"
      onClick={() => handleEmail(email)}
    >
      Email {email}
    </button>
  );
}
