import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const title = searchParams.get('title') || 'Codiary Note';
    const summary = searchParams.get('summary') || 'Private AI-Powered Personal Knowledge Vault.';
    const tagsParam = searchParams.get('tags') || 'ideas,notes';
    const tags = tagsParam.split(',').filter(Boolean);

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            backgroundColor: '#09090b',
            padding: '60px',
            fontFamily: 'sans-serif',
            color: '#ffffff',
            backgroundImage: 'radial-gradient(circle at 25px 25px, rgba(255, 255, 255, 0.05) 2px, transparent 0)',
            backgroundSize: '50px 50px',
          }}
        >
          {/* Header Branding */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #aac2ec, #f5c6a5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#09090b',
                  fontWeight: 'bold',
                  fontSize: '20px',
                }}
              >
                C
              </div>
              <span
                style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  letterSpacing: '-0.02em',
                  background: 'linear-gradient(to right, #ffffff, #a1a1aa)',
                  backgroundClip: 'text',
                  color: 'transparent',
                }}
              >
                Codiary Note Vault
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(245, 198, 165, 0.1)',
                border: '1px solid rgba(245, 198, 165, 0.3)',
                color: '#f5c6a5',
                fontSize: '14px',
                fontWeight: '600',
              }}
            >
              ✦ Private Note
            </div>
          </div>

          {/* Main Title & Summary Content */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              marginTop: '40px',
              marginBottom: '40px',
              maxWidth: '900px',
            }}
          >
            <div
              style={{
                fontSize: '48px',
                fontWeight: '900',
                lineHeight: '1.2',
                letterSpacing: '-0.03em',
                color: '#ffffff',
              }}
            >
              {title}
            </div>

            {summary && (
              <div
                style={{
                  fontSize: '20px',
                  color: '#a1a1aa',
                  lineHeight: '1.5',
                  maxHeight: '80px',
                  overflow: 'hidden',
                }}
              >
                {summary}
              </div>
            )}
          </div>

          {/* Footer Tags */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginTop: 'auto',
              width: '100%',
              paddingTop: '30px',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            {tags.slice(0, 4).map((tag, idx) => (
              <div
                key={idx}
                style={{
                  padding: '6px 14px',
                  backgroundColor: '#18181b',
                  border: '1px solid #27272a',
                  borderRadius: '9999px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#d4d4d8',
                }}
              >
                #{tag}
              </div>
            ))}
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    return new Response(`Failed to generate OpenGraph image: ${e.message}`, {
      status: 500,
    });
  }
}
