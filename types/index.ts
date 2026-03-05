export interface WordFrequency {
  id: string;
  word: string;
  frequency: number;
  category: 'crime' | 'cyber' | 'banking' | 'general';
  date_range_start: string;
  date_range_end: string;
  batch_date: string;
  updated_at: string;
}

export interface MarketTrend {
  id: string;
  title: string;
  url: string;
  source: string;
  summary: string;
  published_at: string | null;
  relevance_score: number;
  keywords: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  batch_date: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  auth_user_id: string | null;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  territory_states: string[];
  approved: boolean;
  denied: boolean;
  denial_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApprovalToken {
  id: string;
  user_profile_id: string;
  token: string;
  expires_at: string;
  used: boolean;
  action_taken: 'approved' | 'denied' | null;
  created_at: string;
}

export interface SignupFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
  territory_states: string[];
}

export interface NewsArticle {
  title: string;
  url: string;
  source: string;
  content: string;
  publishedAt: string | null;
  keywords: string[];
}

export const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California',
  'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia',
  'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
  'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland',
  'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri',
  'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey',
  'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
  'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina',
  'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
  'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming',
];

export const US_STATES_ABBR: Record<string, string> = {
  'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR',
  'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE',
  'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI', 'Idaho': 'ID',
  'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA', 'Kansas': 'KS',
  'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
  'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS',
  'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV',
  'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
  'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK',
  'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
  'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT',
  'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV',
  'Wisconsin': 'WI', 'Wyoming': 'WY',
};

export const SEARCH_KEYWORDS = [
  'robberies',
  'robbery',
  'cyberattacks',
  'cyber attack',
  'atm theft',
  'skimming',
  'card skimming',
  'jackpotting',
  'hook and chain',
  'bank robbery',
  'credit union',
  'financial institution security',
  'phishing',
  'ransomware',
  'data breach',
  'fraud',
  'identity theft',
];

export const QUERY_STRING =
  'robberies OR "bank robbery" OR cyberattacks OR "atm theft" OR skimming ' +
  'OR jackpotting OR "hook and chain" OR "credit union" OR "financial institution" ' +
  'phishing OR ransomware OR "data breach" OR fraud banking';
