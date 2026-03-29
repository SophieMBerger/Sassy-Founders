export interface Founder {
  id: number;
  name: string;
  company: string;
  title: string;
  imageUrl?: string;
  bio: string;
  sassyScore: number; // 0-10 whiskey units (algorithmic)
  communityScore: number | null; // average of user submissions
  communityVoteCount: number;
  scoreBreakdown: ScoreBreakdown;
}

export interface ScoreBreakdown {
  arrogance: number;
  controversialTakes: number;
  interruptionTendency: number;
  humblebragging: number;
  buzzwordDensity: number;
}

export interface UserVote {
  founderId: number;
  whiskeyUnits: number; // 0-10
}

export interface RankingResponse {
  founders: Founder[];
  total: number;
}

export interface FounderDetailResponse extends Founder {
  communityVotes: UserVote[];
}
