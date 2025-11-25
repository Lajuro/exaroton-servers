import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const size = {
  width: 180,
  height: 180,
}
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          borderRadius: '36px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {/* Minecraft-style blocks */}
          <div style={{ display: 'flex', gap: '4px' }}>
            <div
              style={{
                width: '30px',
                height: '30px',
                background: 'linear-gradient(180deg, #4ade80 0%, #4ade80 30%, #8B4513 30%, #8B4513 100%)',
                borderRadius: '4px',
              }}
            />
            <div
              style={{
                width: '30px',
                height: '30px',
                background: '#6b7280',
                borderRadius: '4px',
              }}
            />
            <div
              style={{
                width: '30px',
                height: '30px',
                background: 'linear-gradient(135deg, #22d3ee, #06b6d4)',
                borderRadius: '4px',
              }}
            />
          </div>
          <div
            style={{
              fontSize: '28px',
              fontWeight: 'bold',
              color: 'white',
              letterSpacing: '-1px',
            }}
          >
            <span style={{ color: '#4ade80' }}>M</span>
            <span style={{ color: '#ffffff' }}>S</span>
            <span style={{ color: '#22d3ee' }}>M</span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
