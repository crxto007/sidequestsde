export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  points: number;
  created_at: string;
}

export interface Group {
  id: string;
  name: string;
  invite_code: string;
  created_by: string;
  created_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  joined_at: string;
  profiles?: Profile;
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
  group_id: string;
  quest_id: string;
  status: QuestStatus;
  started_at: string;
  expires_at: string;
  completed_at: string | null;
  quests?: Quest;
}

export interface QuestProof {
  id: string;
  active_quest_id: string;
  user_id: string;
  image_url: string;
  uploaded_at: string;
}
