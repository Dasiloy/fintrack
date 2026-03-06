import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://fintrack.live';

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#170f3a',
        borderRadius: 6,
      }}
    >
      <img src={`${baseUrl}/logo-icon-white.png`} width={24} height={24} />
    </div>,
    { ...size },
  );
}
