export interface CreateBattleDto {
  event_id: string;
  round: string;
  position: number;
  participant_a_id: string;
  participant_b_id: string;
  status: 'pending' | 'active' | 'closed';
}

export type BattleInsert = {
  event_id: string;
  round: string;
  position: number;
  participant_a_id?: string | null;
  participant_b_id?: string | null;
  status: 'pending' | 'active' | 'closed';
  next_battle_id?: string | null;
  next_slot?: 'A' | 'B' | null;
};