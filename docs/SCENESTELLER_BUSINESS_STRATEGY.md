# SceneSteller Business Strategy

## DevOps & Indie Hacker 관점에서의 전략 제안

---

## 1. Executive Summary

SceneSteller는 DevPersona의 개발자 프로필 데이터를 활용하여 AI 기반 개인화 이미지를 생성하는 서비스입니다.
이 문서는 DevOps 엔지니어와 인디해커 관점에서 SceneSteller의 비즈니스 가치를 극대화하는 전략을 제안합니다.

---

## 2. DevOps 관점의 이점

### 2.1 Infrastructure as Revenue (IaR)

```
┌─────────────────────────────────────────────────────────────┐
│  DevPersona                      SceneSteller               │
│  ┌──────────────┐               ┌──────────────┐           │
│  │   GitHub     │──────────────▶│   AI Image   │           │
│  │   Analysis   │   Prompt      │   Generation │           │
│  └──────────────┘               └──────────────┘           │
│        │                              │                     │
│        ▼                              ▼                     │
│  ┌──────────────┐               ┌──────────────┐           │
│  │   FREE       │               │   PAID       │           │
│  │   (Viral)    │               │   (Revenue)  │           │
│  └──────────────┘               └──────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

**핵심 전략:**
- DevPersona: 무료로 바이럴리티 확보 (GitHub 분석, FIFA 카드)
- SceneSteller: 유료 이미지 생성으로 수익화

### 2.2 Cost Optimization

| 항목 | 현재 비용 | 최적화 후 |
|------|----------|-----------|
| GitHub API | $0 (BYOT) | $0 |
| npm API | $0 (Public) | $0 |
| HN Algolia | $0 (Public) | $0 |
| AI Image Gen | $0.02-0.05/img | Tiered pricing |
| Hosting (Vercel) | $0-20/mo | Edge + Caching |
| Convex DB | $0-25/mo | Optimized queries |

**비용 절감 전략:**
1. **이미지 캐싱**: 동일 프롬프트는 재생성하지 않고 캐시된 결과 반환
2. **배치 처리**: 야간 시간대에 인기 프로필 이미지 미리 생성
3. **Progressive Generation**: 저해상도 미리보기 → 결제 후 고해상도

### 2.3 Observability & Metrics

```yaml
# 핵심 메트릭 대시보드
metrics:
  business:
    - conversion_rate: "분석 → SceneSteller 클릭률"
    - completion_rate: "이미지 생성 완료율"
    - revenue_per_user: "사용자당 평균 수익"

  technical:
    - api_latency_p99: "GitHub API 응답 시간"
    - image_gen_time: "이미지 생성 소요 시간"
    - cache_hit_rate: "캐시 적중률"

  virality:
    - share_rate: "결과 공유율"
    - referral_source: "유입 경로"
    - k_factor: "바이럴 계수"
```

---

## 3. 인디해커 관점의 전략

### 3.1 Lean Monetization Model

```
┌─────────────────────────────────────────────────────────────┐
│                    FREEMIUM FUNNEL                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  FREE TIER (Viral Engine)                                   │
│  ├─ GitHub Profile Analysis                                 │
│  ├─ FIFA-Style Card                                         │
│  ├─ Hexagon Radar Chart                                     │
│  ├─ 40+ Achievement Badges                                  │
│  └─ Global Leaderboard                                      │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  PAID TIER ($2.99/image or $9.99/month)                     │
│  ├─ SceneSteller AI Art                                     │
│  ├─ Custom Themes (Dark, Light, Neon, etc.)                 │
│  ├─ High-Resolution Download (4K)                           │
│  ├─ Remove Watermark                                        │
│  └─ Priority Generation Queue                               │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  ENTERPRISE ($49/month)                                     │
│  ├─ Team Analytics Dashboard                                │
│  ├─ API Access                                              │
│  ├─ Custom Branding                                         │
│  └─ Bulk Export                                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Revenue Projections

| 시나리오 | MAU | 전환율 | ARPU | MRR |
|----------|-----|--------|------|-----|
| Conservative | 10,000 | 1% | $5 | $500 |
| Moderate | 50,000 | 2% | $7 | $7,000 |
| Aggressive | 200,000 | 3% | $10 | $60,000 |

### 3.3 Growth Hacks

#### A. Twitter/X 바이럴 엔진

```typescript
// 자동 트윗 최적화
const tweetFormats = [
  "Just discovered I'm a {tier} tier developer on DevPersona! 🔥\n\n{card_image}\n\nFind your score: devpersona.dev/{username}",
  "My GitHub activity says I'm '{archetype}' 😅\n\n{radar_chart}\n\n#DevPersona #GitHubStats",
  "Earned the '{achievement}' badge! 🏅\n\n{badge_image}\n\nWhat's your developer persona?",
];
```

#### B. LinkedIn 통합

```typescript
// LinkedIn 공유 최적화
const linkedInPost = {
  title: "Developer Skill Analysis",
  description: `According to my GitHub activity analysis,
                my strongest signal is ${topSignal}.
                Check out your profile at devpersona.dev`,
  image: ogImageUrl,
};
```

#### C. Discord/Slack 봇

```typescript
// /devpersona @username 명령어
const botIntegration = {
  command: '/devpersona',
  response: 'FIFA-style card embed with analyze link',
  webhook: 'Real-time leaderboard updates'
};
```

### 3.4 Product-Led Growth (PLG) 전략

```
┌───────────────────────────────────────────────────────────────┐
│                     PLG FLYWHEEL                              │
│                                                               │
│       ┌─────────┐                                             │
│       │  User   │                                             │
│       │ Shares  │◀─────────────────────┐                      │
│       └────┬────┘                      │                      │
│            │                           │                      │
│            ▼                           │                      │
│       ┌─────────┐                 ┌────┴────┐                 │
│       │  New    │                 │  Gets   │                 │
│       │  User   │────────────────▶│ Awesome │                 │
│       │  Joins  │                 │ Results │                 │
│       └─────────┘                 └─────────┘                 │
│                                                               │
│   Key Metric: K-Factor (Viral Coefficient)                    │
│   Target: K > 1 (Each user brings >1 new user)                │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

---

## 4. SceneSteller 통합 포인트

### 4.1 현재 통합 (Phase 1 완료)

| 위치 | 컴포넌트 | 기능 |
|------|----------|------|
| Profile Header | `SceneStellerMiniCTA` | "🎨 Create Your Art" 버튼 |
| Footer | `PoweredBySceneSteller` | 브랜딩 배너 |
| Auto Prompt | `generatePrompt()` | Tier + Archetype 기반 프롬프트 |

### 4.2 추가 통합 제안

#### A. Achievement 뱃지 → NFT 민팅

```typescript
// Achievement를 NFT로 변환
interface AchievementNFT {
  achievement: Achievement;
  imageUrl: string; // SceneSteller 생성 이미지
  rarity: 'common' | 'rare' | 'legendary';
  mintedAt: Date;
}

// Revenue: 민팅 수수료 + 2차 거래 로열티
```

#### B. Leaderboard Top 10 → 자동 아트 생성

```typescript
// 주간 Top 10 개발자 자동 아트 생성
const weeklyTopArt = async () => {
  const topUsers = await getLeaderboardTop(10);

  for (const user of topUsers) {
    await generateSceneStellerArt({
      username: user.username,
      theme: 'hall-of-fame',
      watermark: true, // Free preview
    });
  }
};
```

#### C. Team/Company Dashboard

```typescript
// 팀 대시보드 통합
interface TeamDashboard {
  companyName: string;
  members: AnalysisResult[];
  aggregateStats: {
    averageRating: number;
    topArchetypes: string[];
    collectiveAchievements: Achievement[];
  };
  teamArt: string; // SceneSteller 팀 아트
}
```

---

## 5. 기술 아키텍처 제안

### 5.1 Edge-First Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     EDGE NETWORK                            │
│                                                             │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐       │
│  │ Vercel  │  │ Vercel  │  │ Vercel  │  │ Vercel  │       │
│  │ Edge    │  │ Edge    │  │ Edge    │  │ Edge    │       │
│  │ (KR)    │  │ (US)    │  │ (EU)    │  │ (JP)    │       │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘       │
│       │            │            │            │             │
│       └────────────┴────────────┴────────────┘             │
│                         │                                   │
│                         ▼                                   │
│                  ┌─────────────┐                            │
│                  │   Convex    │                            │
│                  │   (Global)  │                            │
│                  └─────────────┘                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Caching Strategy

```typescript
// 3-Tier Caching
const cacheLayers = {
  // L1: Browser (5 min)
  browser: {
    profileData: '5m',
    leaderboard: '1m',
  },

  // L2: Edge (1 hour)
  edge: {
    ogImages: '24h',
    staticAssets: '7d',
  },

  // L3: Origin (Convex)
  origin: {
    analysisResults: '24h',
    achievements: 'perpetual',
  },
};
```

### 5.3 Rate Limiting & Fair Use

```typescript
// IP 기반 Rate Limiting
const rateLimits = {
  anonymous: {
    analyze: '10/hour',
    leaderboard: '30/hour',
  },
  authenticated: {
    analyze: '100/hour',
    leaderboard: 'unlimited',
    scenesteller: '5/day (free) | unlimited (paid)',
  },
};
```

---

## 6. 마케팅 전략

### 6.1 Launch Channels

| 채널 | 전략 | 예상 임팩트 |
|------|------|-------------|
| Product Hunt | Launch Day 캠페인 | Top 5 목표 |
| Hacker News | Show HN 포스트 | Front Page 목표 |
| Twitter/X | 인플루언서 협업 | 10K+ 노출 |
| Dev.to | 기술 블로그 | SEO + 신뢰도 |
| Reddit r/programming | 유기적 공유 | 커뮤니티 검증 |

### 6.2 Content Calendar

```markdown
Week 1: "What's your Developer Persona?" (Launch)
Week 2: "The Science Behind the Signals" (Technical Deep-dive)
Week 3: "Top 100 Developers Worldwide" (Leaderboard Feature)
Week 4: "SceneSteller: AI Art for Developers" (Monetization Push)
```

### 6.3 Influencer Outreach

| Tier | 팔로워 수 | 접근 방식 | 인센티브 |
|------|----------|-----------|----------|
| Mega | 100K+ | 유료 협찬 | $$$ + Free Pro |
| Macro | 10K-100K | 무료 제품 | Free Pro Forever |
| Micro | 1K-10K | 유기적 발견 | 리더보드 노출 |
| Nano | <1K | 자동 트윗 | 뱃지 시스템 |

---

## 7. 리스크 관리

### 7.1 Technical Risks

| 리스크 | 영향도 | 완화 전략 |
|--------|--------|-----------|
| GitHub API Rate Limit | High | BYOT (Bring Your Own Token) |
| AI Image Cost Spike | Medium | Caching + Tiered Pricing |
| Vercel Cost Explosion | Medium | Edge Caching + Usage Caps |
| Convex Outage | High | Graceful Degradation |

### 7.2 Business Risks

| 리스크 | 영향도 | 완화 전략 |
|--------|--------|-----------|
| Low Conversion | High | A/B Test CTAs |
| Competitor Entry | Medium | First-mover Advantage |
| Platform Policy Change | Low | Multi-Platform Strategy |

---

## 8. KPIs & Success Metrics

### 8.1 North Star Metric

**Weekly Active Sharers (WAS)**: 일주일 내 결과를 공유한 사용자 수

### 8.2 Supporting Metrics

```yaml
acquisition:
  - daily_signups
  - traffic_source_breakdown
  - cost_per_acquisition

activation:
  - analysis_completion_rate
  - time_to_first_share
  - scenesteller_cta_click_rate

revenue:
  - conversion_rate
  - average_revenue_per_user
  - monthly_recurring_revenue

retention:
  - return_visitor_rate
  - achievement_unlock_rate
  - leaderboard_engagement

referral:
  - k_factor
  - share_to_signup_ratio
  - twitter_mention_count
```

---

## 9. Implementation Roadmap

### Q1 2026

- [x] Phase 1-5: Core Features
- [ ] Phase 6: Business Strategy Implementation
- [ ] Launch on Product Hunt
- [ ] First 10,000 Users

### Q2 2026

- [ ] SceneSteller Premium Launch
- [ ] Team/Enterprise Tier
- [ ] API Access (Beta)
- [ ] $5,000 MRR Goal

### Q3 2026

- [ ] NFT Integration (Optional)
- [ ] Mobile App (PWA)
- [ ] International Expansion
- [ ] $20,000 MRR Goal

### Q4 2026

- [ ] B2B Partnerships
- [ ] White-label Solution
- [ ] Profitability
- [ ] $50,000 MRR Goal

---

## 10. Conclusion

DevPersona + SceneSteller 조합은 다음을 제공합니다:

1. **무료 바이럴 엔진**: GitHub 분석으로 유저 획득
2. **자연스러운 업셀**: AI 아트로 수익화
3. **낮은 운영 비용**: BYOT + Edge + Caching
4. **높은 공유율**: 게이미피케이션 + 소셜 프루프
5. **확장 가능한 모델**: 개인 → 팀 → 기업

**핵심 메시지**: "Analyze for free, Create for value."

---

*Last Updated: 2026-01-16*
*Author: DevPersona Team*
