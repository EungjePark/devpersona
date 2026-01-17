// Signal breakdown calculations for transparency modal
// Shows users exactly how each signal score is calculated

import type { SignalScores, GitHubRepo, NpmPackage, CommunityMetrics, ContributionStats } from '../types';

export interface BreakdownItem {
  label: string;
  value: number;
  weight: number;
  contribution: number; // Percentage contribution to final score
}

export interface SignalBreakdown {
  signal: keyof SignalScores;
  displayName: string;
  score: number;
  formula: string;
  items: BreakdownItem[];
  tips: string[];
}

// Calculate GRIT breakdown
export function calculateGritBreakdown(
  contributions: ContributionStats | null,
  baseScore: number
): SignalBreakdown {
  const items: BreakdownItem[] = [];

  if (contributions) {
    items.push({
      label: 'Current Streak',
      value: contributions.currentStreak,
      weight: 0.5,
      contribution: Math.min(20, contributions.currentStreak * 0.5),
    });
    items.push({
      label: 'Avg. Contributions/Day',
      value: contributions.averagePerDay,
      weight: 20,
      contribution: Math.min(10, contributions.averagePerDay * 20),
    });
    items.push({
      label: 'Consistency Score',
      value: baseScore,
      weight: 1.0,
      contribution: baseScore,
    });
  }

  return {
    signal: 'grit',
    displayName: 'GRIND',
    score: Math.round(items.reduce((sum, item) => sum + item.contribution, 0)),
    formula: 'Base CV Score + Streak Bonus + Consistency Bonus',
    items,
    tips: [
      'Commit regularly to maintain your streak',
      'Aim for consistent weekly contributions',
      'Avoid long gaps between commits',
    ],
  };
}

// Calculate FOCUS breakdown
export function calculateFocusBreakdown(repos: GitHubRepo[]): SignalBreakdown {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const activeRepos = repos.filter(repo => {
    const pushedAt = new Date(repo.pushed_at);
    return pushedAt > sixMonthsAgo && !repo.archived;
  });

  const ratio = repos.length > 0 ? activeRepos.length / repos.length : 0;
  const score = 20 + (ratio * 80);

  return {
    signal: 'focus',
    displayName: 'DEPTH',
    score: Math.round(score),
    formula: '20 + (Active Repos / Total Repos) × 80',
    items: [
      { label: 'Active Repos (6 months)', value: activeRepos.length, weight: 1.0, contribution: activeRepos.length },
      { label: 'Total Repos', value: repos.length, weight: 1.0, contribution: repos.length },
      { label: 'Active Ratio', value: Math.round(ratio * 100), weight: 80, contribution: Math.round(ratio * 80) },
    ],
    tips: [
      'Focus on fewer projects at a time',
      'Keep active projects updated regularly',
      'Archive abandoned repositories',
    ],
  };
}

// Calculate CRAFT breakdown
export function calculateCraftBreakdown(repos: GitHubRepo[]): SignalBreakdown {
  let descriptionCount = 0;
  let licenseCount = 0;
  let readmeCount = 0;

  repos.forEach(repo => {
    if (repo.description && repo.description.length > 10) descriptionCount++;
    if (repo.license) licenseCount++;
    if (repo.has_readme || (repo.description && repo.description.length > 50)) readmeCount++;
  });

  const avgScore = repos.length > 0
    ? ((descriptionCount * 33) + (licenseCount * 33) + (readmeCount * 34)) / repos.length
    : 50;

  return {
    signal: 'craft',
    displayName: 'SHINE',
    score: Math.round(Math.max(20, Math.min(100, avgScore))),
    formula: '(Description ×33 + License ×33 + README ×34) / Repos',
    items: [
      { label: 'With Description', value: descriptionCount, weight: 33, contribution: repos.length > 0 ? (descriptionCount / repos.length) * 33 : 0 },
      { label: 'With License', value: licenseCount, weight: 33, contribution: repos.length > 0 ? (licenseCount / repos.length) * 33 : 0 },
      { label: 'With README', value: readmeCount, weight: 34, contribution: repos.length > 0 ? (readmeCount / repos.length) * 34 : 0 },
    ],
    tips: [
      'Add clear descriptions to all repos',
      'Include a LICENSE file',
      'Write comprehensive READMEs',
    ],
  };
}

// Calculate IMPACT breakdown
export function calculateImpactBreakdown(packages: NpmPackage[]): SignalBreakdown {
  const totalDownloads = packages.reduce((sum, pkg) => sum + pkg.downloads, 0);
  const topPackages = [...packages].sort((a, b) => b.downloads - a.downloads).slice(0, 5);

  const logDownloads = totalDownloads > 0 ? Math.log10(totalDownloads + 1) : 0;
  const score = totalDownloads === 0 ? 20 : Math.min(100, 25 + (logDownloads * 10));

  return {
    signal: 'impact',
    displayName: 'BOOM',
    score: Math.round(score),
    formula: 'min(100, 25 + log10(downloads) × 10)',
    items: [
      { label: 'Total Downloads', value: totalDownloads, weight: 10, contribution: logDownloads * 10 },
      { label: 'Package Count', value: packages.length, weight: 1.0, contribution: packages.length },
      ...topPackages.slice(0, 3).map(pkg => ({
        label: pkg.name,
        value: pkg.downloads,
        weight: 1.0,
        contribution: Math.log10(pkg.downloads + 1) * 2,
      })),
    ],
    tips: [
      'Publish useful packages to npm',
      'Maintain and update your packages',
      'Promote your packages in the community',
    ],
  };
}

// Calculate COMMUNITY breakdown (replacing VOICE)
export function calculateCommunityBreakdown(metrics: CommunityMetrics | undefined): SignalBreakdown {
  const m = metrics ?? { externalPRs: 0, prsReceived: 0, issuesReceived: 0, uniqueContributors: 0 };

  const combined = (m.externalPRs * 3.0) + (m.prsReceived * 2.0) + (m.issuesReceived * 1.0) + (m.uniqueContributors * 1.5);
  const logScore = combined > 0 ? Math.log10(combined + 1) : 0;
  const score = combined === 0 ? 20 : Math.min(100, 20 + (logScore * 20));

  return {
    signal: 'voice',
    displayName: 'COMMUNITY',
    score: Math.round(score),
    formula: 'min(100, 20 + log10(weighted_sum) × 20)',
    items: [
      { label: 'External PRs', value: m.externalPRs, weight: 3.0, contribution: m.externalPRs * 3.0 },
      { label: 'PRs Received', value: m.prsReceived, weight: 2.0, contribution: m.prsReceived * 2.0 },
      { label: 'Issues Received', value: m.issuesReceived, weight: 1.0, contribution: m.issuesReceived * 1.0 },
      { label: 'Unique Contributors', value: m.uniqueContributors, weight: 1.5, contribution: m.uniqueContributors * 1.5 },
    ],
    tips: [
      'Contribute to other open source projects',
      'Make your repos contributor-friendly',
      'Respond to issues and PRs promptly',
    ],
  };
}

// Calculate REACH breakdown
export function calculateReachBreakdown(repos: GitHubRepo[], followers: number): SignalBreakdown {
  const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
  const totalForks = repos.reduce((sum, repo) => sum + repo.forks_count, 0);

  const combined = totalStars + (totalForks * 0.5) + (followers * 0.3);
  const logScore = combined > 0 ? Math.log10(combined + 1) : 0;
  const score = combined === 0 ? 20 : Math.min(100, 20 + (logScore * 18));

  return {
    signal: 'reach',
    displayName: 'CLOUT',
    score: Math.round(score),
    formula: 'min(100, 20 + log10(stars + forks×0.5 + followers×0.3) × 18)',
    items: [
      { label: 'Total Stars', value: totalStars, weight: 1.0, contribution: totalStars },
      { label: 'Total Forks', value: totalForks, weight: 0.5, contribution: totalForks * 0.5 },
      { label: 'Followers', value: followers, weight: 0.3, contribution: followers * 0.3 },
    ],
    tips: [
      'Create repositories that solve real problems',
      'Promote your work on social media',
      'Engage with the developer community',
    ],
  };
}

// Get breakdown for a specific signal
export function getSignalBreakdown(
  signal: keyof SignalScores,
  data: {
    repos: GitHubRepo[];
    followers: number;
    packages: NpmPackage[];
    contributions: ContributionStats | null;
    communityMetrics?: CommunityMetrics;
    signals: SignalScores;
  }
): SignalBreakdown {
  switch (signal) {
    case 'grit':
      return calculateGritBreakdown(data.contributions, data.signals.grit);
    case 'focus':
      return calculateFocusBreakdown(data.repos);
    case 'craft':
      return calculateCraftBreakdown(data.repos);
    case 'impact':
      return calculateImpactBreakdown(data.packages);
    case 'voice':
      return calculateCommunityBreakdown(data.communityMetrics);
    case 'reach':
      return calculateReachBreakdown(data.repos, data.followers);
    default:
      throw new Error(`Unknown signal: ${signal}`);
  }
}
