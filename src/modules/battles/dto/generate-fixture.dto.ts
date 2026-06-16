import { IsIn, IsOptional } from 'class-validator';

export class GenerateFixtureDto {
  @IsOptional()
  @IsIn([2, 4, 8, 16, 32])
  targetSize?: number;
}