export type QualifierScore = 0 | 1 | 2;

export class QualifierVoteDto {
  participantId!: string;
  judgeId!: string;
  score!: 0 | 1 | 2;
}