import { IsNotEmpty, IsOptional, IsString } from 'class-validator'

// GET /menu?category=coffee. The global ValidationPipe rejects anything that doesn't fit.
export class MenuQueryDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  category?: string
}
