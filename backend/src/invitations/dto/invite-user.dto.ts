import { UserRole } from '@prisma/client';
import { IsEmail, IsIn } from 'class-validator';

export class InviteUserDto {
  @IsEmail()
  email: string;

  @IsIn([UserRole.QA_MANAGER, UserRole.TESTER, UserRole.VIEWER])
  role: UserRole;
}
