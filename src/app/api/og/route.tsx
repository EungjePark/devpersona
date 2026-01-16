import { ImageResponse } from '@vercel/og';
import type { NextRequest } from 'next/server';

export const runtime = 'edge';

// Tier colors
const TIER_COLORS: Record<string, string> = {
  S: '#ffd700',
  A: '#a855f7',
  B: '#3b82f6',
  C: '#6b7280',
};

// Grade colors
const GRADE_COLORS: Record<string, string> = {
  S: '#ffd700',
  A: '#22c55e',
  B: '#84cc16',
  C: '#eab308',
  D: '#f97316',
  F: '#ef4444',
};

function getGrade(value: number): string {
  if (value >= 90) return 'S';
  if (value >= 80) return 'A';
  if (value >= 60) return 'B';
  if (value >= 40) return 'C';
  if (value >= 20) return 'D';
  return 'F';
}

function StatRow({ label, value }: { label: string; value: number }) {
  const grade = getGrade(value);
  const color = GRADE_COLORS[grade];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
      <span style={{ width: 60, fontSize: 13, fontWeight: 500, color: '#a1a1aa' }}>
        {label}
      </span>
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 6,
          backgroundColor: `${color}33`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color }}>{grade}</span>
      </div>
      <div
        style={{
          flex: 1,
          height: 10,
          backgroundColor: '#1c1c24',
          borderRadius: 5,
          display: 'flex',
        }}
      >
        <div
          style={{
            width: `${value}%`,
            height: '100%',
            backgroundColor: color,
            borderRadius: 5,
          }}
        />
      </div>
      <span style={{ width: 36, fontSize: 15, fontWeight: 700, color: '#fff', textAlign: 'right' }}>
        {value}
      </span>
    </div>
  );
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  // Parse query params
  const username = searchParams.get('u') || 'developer';
  const archetype = searchParams.get('a') || 'Silent Builder';
  const tier = searchParams.get('t') || 'B';
  const ovr = parseInt(searchParams.get('o') || '50');
  const grit = parseInt(searchParams.get('g') || '50');
  const focus = parseInt(searchParams.get('f') || '50');
  const craft = parseInt(searchParams.get('c') || '50');
  const impact = parseInt(searchParams.get('i') || '50');
  const voice = parseInt(searchParams.get('v') || '50');
  const reach = parseInt(searchParams.get('r') || '50');

  const tierColor = TIER_COLORS[tier] || TIER_COLORS.C;
  const tierName = tier === 'S' ? 'LEGENDARY' : tier === 'A' ? 'EPIC' : tier === 'B' ? 'RARE' : 'COMMON';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0a0a0f',
          padding: 40,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: 520,
            borderRadius: 24,
            padding: 4,
            background: `linear-gradient(135deg, ${tierColor} 0%, ${tierColor}aa 100%)`,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'rgba(10, 10, 15, 0.95)',
              borderRadius: 20,
              padding: 28,
            }}
          >
            {/* Header Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              {/* OVR Box */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 16,
                    backgroundColor: tier === 'S' ? 'rgba(255, 215, 0, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span style={{ fontSize: 42, fontWeight: 900, color: '#fff' }}>{ovr}</span>
                </div>
                <span style={{ fontSize: 13, color: '#71717a', marginTop: 6 }}>OVR</span>
              </div>

              {/* Archetype Info */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <span
                  style={{
                    fontSize: 24,
                    fontWeight: 900,
                    color: '#fff',
                    textTransform: 'uppercase',
                    letterSpacing: '0.03em',
                  }}
                >
                  {archetype}
                </span>
                <span style={{ fontSize: 15, fontWeight: 600, color: tierColor, marginTop: 4 }}>
                  {tierName} - {tier} TIER
                </span>
              </div>
            </div>

            {/* Username */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>@{username}</span>
            </div>

            {/* Stats - Unrolled for @vercel/og compatibility */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <StatRow label="GRIT" value={grit} />
              <StatRow label="FOCUS" value={focus} />
              <StatRow label="CRAFT" value={craft} />
              <StatRow label="IMPACT" value={impact} />
              <StatRow label="VOICE" value={voice} />
              <StatRow label="REACH" value={reach} />
            </div>

            {/* Footer */}
            <div
              style={{
                marginTop: 24,
                padding: 14,
                borderRadius: 10,
                backgroundColor: '#1c1c24',
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: 13, color: '#71717a' }}>
                devpersona.vercel.app
              </span>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
