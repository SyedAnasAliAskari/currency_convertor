import { Transform, Type } from 'class-transformer';
import { IsNumber, IsOptional, Matches, Max, Min } from 'class-validator';

export class ConvertQueryDto {
  @Transform(({ value }) => String(value).trim().toUpperCase())
  @Matches(/^[A-Z]{3}$/, { message: 'from must be a valid three-letter currency code' })
  from!: string;

  @Transform(({ value }) => String(value).trim().toUpperCase())
  @Matches(/^[A-Z]{3}$/, { message: 'to must be a valid three-letter currency code' })
  to!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 8 }, { message: 'amount must be a valid number' })
  @Min(0.00000001, { message: 'amount must be greater than zero' })
  @Max(1_000_000_000_000, { message: 'amount is too large' })
  amount!: number;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must use YYYY-MM-DD format' })
  date?: string;
}
