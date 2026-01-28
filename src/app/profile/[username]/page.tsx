import type { Metadata } from 'next';
import ProfileClient from './ProfileClient';

type Props = {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;

  return {
    title: `@${username} | DevPersona Profile`,
    description: `View ${username}'s builder profile, launches, ideas, and community karma on DevPersona`,
    openGraph: {
      title: `@${username} | DevPersona Profile`,
      description: `Builder profile for @${username}`,
      type: 'profile',
      siteName: 'DevPersona',
    },
    twitter: {
      card: 'summary_large_image',
      title: `@${username} | DevPersona Profile`,
      description: `Builder profile for @${username}`,
    },
  };
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;
  return <ProfileClient username={username} />;
}
