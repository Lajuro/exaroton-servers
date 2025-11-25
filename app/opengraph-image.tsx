import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'MineServerManager - Gerenciador de Servidores Minecraft'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Minecraft-style grid background */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexWrap: 'wrap',
            opacity: 0.1,
          }}
        >
          {Array.from({ length: 120 }).map((_, i) => (
            <div
              key={i}
              style={{
                width: '100px',
                height: '100px',
                border: '1px solid #4ade80',
              }}
            />
          ))}
        </div>

        {/* Top decorative bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '8px',
            background: 'linear-gradient(90deg, #22c55e, #4ade80, #86efac, #4ade80, #22c55e)',
          }}
        />

        {/* Logo area with blocks */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '30px',
            marginBottom: '20px',
          }}
        >
          {/* Minecraft-style blocks */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {/* Grass block */}
            <div
              style={{
                width: '80px',
                height: '80px',
                background: 'linear-gradient(180deg, #4ade80 0%, #4ade80 30%, #8B4513 30%, #8B4513 100%)',
                borderRadius: '8px',
                border: '4px solid rgba(255,255,255,0.3)',
                boxShadow: '0 4px 20px rgba(74, 222, 128, 0.4)',
              }}
            />
            {/* Stone block */}
            <div
              style={{
                width: '80px',
                height: '80px',
                background: '#6b7280',
                borderRadius: '8px',
                border: '4px solid rgba(255,255,255,0.3)',
                boxShadow: '0 4px 20px rgba(107, 114, 128, 0.4)',
              }}
            />
            {/* Diamond block */}
            <div
              style={{
                width: '80px',
                height: '80px',
                background: 'linear-gradient(135deg, #22d3ee, #06b6d4)',
                borderRadius: '8px',
                border: '4px solid rgba(255,255,255,0.3)',
                boxShadow: '0 4px 20px rgba(34, 211, 238, 0.4)',
              }}
            />
          </div>
        </div>

        {/* Main title */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <h1
            style={{
              fontSize: '72px',
              fontWeight: 'bold',
              color: '#ffffff',
              margin: 0,
              textShadow: '0 4px 20px rgba(74, 222, 128, 0.5), 0 0 40px rgba(74, 222, 128, 0.3)',
              letterSpacing: '-2px',
            }}
          >
            <span style={{ color: '#4ade80' }}>Mine</span>
            <span style={{ color: '#ffffff' }}>Server</span>
            <span style={{ color: '#22d3ee' }}>Manager</span>
          </h1>

          <p
            style={{
              fontSize: '28px',
              color: '#94a3b8',
              margin: 0,
              textAlign: 'center',
              maxWidth: '800px',
            }}
          >
            Gerencie seus servidores Minecraft da Exaroton
          </p>
        </div>

        {/* Feature badges */}
        <div
          style={{
            display: 'flex',
            gap: '20px',
            marginTop: '40px',
          }}
        >
          {['Tempo Real', 'Multi-servidor', 'Fácil de Usar'].map((feature) => (
            <div
              key={feature}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(74, 222, 128, 0.15)',
                border: '2px solid rgba(74, 222, 128, 0.3)',
                borderRadius: '9999px',
                padding: '12px 24px',
              }}
            >
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: '#4ade80',
                }}
              />
              <span style={{ color: '#4ade80', fontSize: '18px', fontWeight: '600' }}>
                {feature}
              </span>
            </div>
          ))}
        </div>

        {/* Bottom decorative bar */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '8px',
            background: 'linear-gradient(90deg, #22c55e, #4ade80, #86efac, #4ade80, #22c55e)',
          }}
        />

        {/* Exaroton mention */}
        <div
          style={{
            position: 'absolute',
            bottom: '30px',
            right: '40px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#64748b',
            fontSize: '16px',
          }}
        >
          Powered by Exaroton
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
