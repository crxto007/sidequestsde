export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  points: number;
  created_at: string;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  category: string;
  points_value: number;
}

export type QuestStatus = 'active' | 'completed' | 'expired';

export interface ActiveQuest {
  id: string;
  user_id: string;
  quest_id: string;
  quest_title: string;
  quest_description: string;
  points_value: number;
  status: QuestStatus;
  started_at: string;
  expires_at: string;
  completed_at: string | null;
}

export interface QuestProof {
  id: string;
  active_quest_id: string;
  user_id: string;
  image_url: string;
  uploaded_at: string;
}
