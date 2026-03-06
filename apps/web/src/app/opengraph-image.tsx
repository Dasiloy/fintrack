import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'Fintrack';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://fintrack.live';

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          background: '#170f3a',
        }}
      >
        <img
          src={`${baseUrl}/logo-icon-white.png`}
          width={140}
          height={140}
          style={{ marginBottom: 32 }}
        />
        <p
          style={{
            fontSize: 80,
            fontWeight: 700,
            color: '#ffffff',
            margin: 0,
            letterSpacing: '-2px',
            fontFamily: 'sans-serif',
          }}
        >
          Fintrack
        </p>
        <p
          style={{
            fontSize: 30,
            color: '#b4b4c0',
            margin: '16px 0 0',
            fontWeight: 400,
            fontFamily: 'sans-serif',
          }}
        >
          AI-powered financial budgeting
        </p>
      </div>
    ),
    { ...size },
  );
}
