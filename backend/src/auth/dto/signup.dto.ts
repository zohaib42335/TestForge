import { IsEmail, IsString, Length, MaxLength, MinLength } from 'class-validator';

export class SignupDto {
  @IsString()
  @Length(2, 50)
  displayName: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;

  @IsString()
  @Length(2, 100)
  companyName: string;
}
