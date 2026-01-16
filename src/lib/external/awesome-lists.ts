/**
 * Awesome Lists Integration
 * Check if user's repos are featured in awesome lists
 */

export interface AwesomeCategory {
  id: string;
  name: string;
  emoji: string;
  description: string;
  repoUrl: string;
  keywords: string[];
}

// Popular awesome list categories
export const AWESOME_CATEGORIES: AwesomeCategory[] = [
  {
    id: 'javascript',
    name: 'JavaScript',
    emoji: '💛',
    description: 'A collection of awesome JavaScript libraries and resources',
    repoUrl: 'https://github.com/sorrycc/awesome-javascript',
    keywords: ['javascript', 'js', 'node', 'npm', 'typescript'],
  },
  {
    id: 'react',
    name: 'React',
    emoji: '⚛️',
    description: 'Awesome React components and resources',
    repoUrl: 'https://github.com/enaqx/awesome-react',
    keywords: ['react', 'redux', 'nextjs', 'gatsby'],
  },
  {
    id: 'vue',
    name: 'Vue.js',
    emoji: '💚',
    description: 'Curated list of Vue.js resources',
    repoUrl: 'https://github.com/vuejs/awesome-vue',
    keywords: ['vue', 'vuex', 'nuxt', 'vuetify'],
  },
  {
    id: 'python',
    name: 'Python',
    emoji: '🐍',
    description: 'Awesome Python frameworks and libraries',
    repoUrl: 'https://github.com/vinta/awesome-python',
    keywords: ['python', 'django', 'flask', 'fastapi'],
  },
  {
    id: 'rust',
    name: 'Rust',
    emoji: '🦀',
    description: 'Curated list of Rust code and resources',
    repoUrl: 'https://github.com/rust-unofficial/awesome-rust',
    keywords: ['rust', 'cargo', 'tokio', 'actix'],
  },
  {
    id: 'go',
    name: 'Go',
    emoji: '🐹',
    description: 'Awesome Go frameworks and libraries',
    repoUrl: 'https://github.com/avelino/awesome-go',
    keywords: ['go', 'golang', 'gin', 'echo'],
  },
  {
    id: 'nodejs',
    name: 'Node.js',
    emoji: '💚',
    description: 'Delightful Node.js packages and resources',
    repoUrl: 'https://github.com/sindresorhus/awesome-nodejs',
    keywords: ['node', 'nodejs', 'npm', 'express', 'koa'],
  },
  {
    id: 'typescript',
    name: 'TypeScript',
    emoji: '💙',
    description: 'Awesome TypeScript resources',
    repoUrl: 'https://github.com/dzharii/awesome-typescript',
    keywords: ['typescript', 'ts', 'types', 'typings'],
  },
  {
    id: 'swift',
    name: 'Swift',
    emoji: '🍎',
    description: 'Awesome Swift libraries and resources',
    repoUrl: 'https://github.com/matteocrippa/awesome-swift',
    keywords: ['swift', 'ios', 'macos', 'swiftui'],
  },
  {
    id: 'kotlin',
    name: 'Kotlin',
    emoji: '🟣',
    description: 'Curated list of Kotlin resources',
    repoUrl: 'https://github.com/KotlinBy/awesome-kotlin',
    keywords: ['kotlin', 'android', 'ktor', 'coroutines'],
  },
  {
    id: 'machine-learning',
    name: 'Machine Learning',
    emoji: '🤖',
    description: 'Curated list of ML frameworks and tutorials',
    repoUrl: 'https://github.com/josephmisiti/awesome-machine-learning',
    keywords: ['ml', 'ai', 'tensorflow', 'pytorch', 'neural'],
  },
  {
    id: 'devops',
    name: 'DevOps',
    emoji: '🔧',
    description: 'Awesome DevOps tools and practices',
    repoUrl: 'https://github.com/wmariuss/awesome-devops',
    keywords: ['devops', 'docker', 'kubernetes', 'ci', 'cd', 'terraform'],
  },
  {
    id: 'selfhosted',
    name: 'Self-Hosted',
    emoji: '🏠',
    description: 'Self-hosted software alternatives',
    repoUrl: 'https://github.com/awesome-selfhosted/awesome-selfhosted',
    keywords: ['selfhosted', 'server', 'hosting', 'homelab'],
  },
  {
    id: 'design',
    name: 'Design Tools',
    emoji: '🎨',
    description: 'Creative design tools and resources',
    repoUrl: 'https://github.com/gztchan/awesome-design',
    keywords: ['design', 'ui', 'ux', 'figma', 'sketch'],
  },
  {
    id: 'security',
    name: 'Security',
    emoji: '🔒',
    description: 'Security tools and resources',
    repoUrl: 'https://github.com/sbilly/awesome-security',
    keywords: ['security', 'hacking', 'pentest', 'ctf'],
  },
];

export interface AwesomeListMatch {
  category: AwesomeCategory;
  confidence: 'high' | 'medium' | 'low';
  matchedKeywords: string[];
}

/**
 * Check if a repo might be featured in awesome lists
 * (Heuristic-based - actual verification would require API calls)
 */
export function checkAwesomeListPotential(
  repoName: string,
  repoDescription: string | null,
  language: string | null,
  stars: number
): AwesomeListMatch[] {
  const matches: AwesomeListMatch[] = [];
  const searchText = `${repoName} ${repoDescription || ''} ${language || ''}`.toLowerCase();

  for (const category of AWESOME_CATEGORIES) {
    const matchedKeywords = category.keywords.filter(keyword =>
      searchText.includes(keyword.toLowerCase())
    );

    if (matchedKeywords.length > 0) {
      // Determine confidence based on stars and keyword matches
      let confidence: 'high' | 'medium' | 'low' = 'low';

      if (stars >= 1000 && matchedKeywords.length >= 2) {
        confidence = 'high';
      } else if (stars >= 500 || matchedKeywords.length >= 2) {
        confidence = 'medium';
      }

      matches.push({
        category,
        confidence,
        matchedKeywords,
      });
    }
  }

  // Sort by confidence
  const confidenceOrder = { high: 0, medium: 1, low: 2 };
  return matches.sort((a, b) => confidenceOrder[a.confidence] - confidenceOrder[b.confidence]);
}

/**
 * Get the most likely awesome categories for a user based on their repos
 */
export function getUserAwesomeCategories(
  repos: Array<{
    name: string;
    description: string | null;
    language: string | null;
    stars: number;
  }>
): Map<string, { category: AwesomeCategory; totalStars: number; repoCount: number }> {
  const categoryMap = new Map<string, { category: AwesomeCategory; totalStars: number; repoCount: number }>();

  for (const repo of repos) {
    const matches = checkAwesomeListPotential(repo.name, repo.description, repo.language, repo.stars);

    for (const match of matches) {
      const existing = categoryMap.get(match.category.id);
      if (existing) {
        existing.totalStars += repo.stars;
        existing.repoCount += 1;
      } else {
        categoryMap.set(match.category.id, {
          category: match.category,
          totalStars: repo.stars,
          repoCount: 1,
        });
      }
    }
  }

  return categoryMap;
}

/**
 * Generate awesome list badges for display
 */
export function getAwesomeBadges(
  categoryMap: Map<string, { category: AwesomeCategory; totalStars: number; repoCount: number }>
): Array<{
  id: string;
  name: string;
  emoji: string;
  stars: number;
  repos: number;
}> {
  return Array.from(categoryMap.values())
    .filter(entry => entry.repoCount >= 1 && entry.totalStars >= 100)
    .sort((a, b) => b.totalStars - a.totalStars)
    .slice(0, 5)
    .map(entry => ({
      id: entry.category.id,
      name: entry.category.name,
      emoji: entry.category.emoji,
      stars: entry.totalStars,
      repos: entry.repoCount,
    }));
}
