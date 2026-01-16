import type { Metadata } from 'next';
import AnalyzeClient from './AnalyzeClient';

type Props = {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { username } = await params;
  const search = await searchParams;

  // Check if we have analysis data in query params (from shared link)
  const hasData = search.a && search.t && search.o;

  if (hasData) {
    // Build OG image URL from search params
    const ogParams = new URLSearchParams();
    ogParams.set('u', username);
    if (search.a) ogParams.set('a', String(search.a));
    if (search.t) ogParams.set('t', String(search.t));
    if (search.o) ogParams.set('o', String(search.o));
    if (search.g) ogParams.set('g', String(search.g));
    if (search.f) ogParams.set('f', String(search.f));
    if (search.c) ogParams.set('c', String(search.c));
    if (search.i) ogParams.set('i', String(search.i));
    if (search.v) ogParams.set('v', String(search.v));
    if (search.r) ogParams.set('r', String(search.r));

    const archetype = search.a || 'Developer';
    const tier = search.t === 'S' ? 'LEGENDARY' : search.t === 'A' ? 'EPIC' : search.t === 'B' ? 'RARE' : 'COMMON';
    const ovr = search.o || '50';

    const title = `@${username} is a ${tier} ${archetype} | DevPersona`;
    const description = `OVR ${ovr} • Discover your developer archetype with DevPersona`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'website',
        siteName: 'DevPersona',
        images: [
          {
            url: `/api/og?${ogParams.toString()}`,
            width: 1200,
            height: 630,
            alt: `${username}'s Developer Card`,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [`/api/og?${ogParams.toString()}`],
      },
    };
  }

  // Default metadata when no data is present (initial page load)
  return {
    title: `@${username} | DevPersona`,
    description: 'Analyzing developer profile...',
    openGraph: {
      title: `@${username} | DevPersona`,
      description: 'Discover your developer archetype',
      type: 'website',
      siteName: 'DevPersona',
    },
    twitter: {
      card: 'summary_large_image',
      title: `@${username} | DevPersona`,
      description: 'Discover your developer archetype',
    },
  };
}

export default async function AnalyzePage({ params }: Props) {
  const { username } = await params;
  return <AnalyzeClient username={username} />;
}
