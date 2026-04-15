import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CompaniesService } from './companies.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get('me')
  getMyCompany(@CurrentUser() user: { companyId: string }) {
    return this.companiesService.getMyCompany(user.companyId);
  }

  @Get('me/usage')
  getUsage(@CurrentUser() user: { companyId: string }) {
    return this.companiesService.getUsage(user.companyId);
  }

  @Roles(UserRole.ADMIN)
  @Patch('me')
  updateCompany(
    @CurrentUser() user: { companyId: string },
    @Body() dto: UpdateCompanyDto,
  ) {
    return this.companiesService.updateCompany(user.companyId, dto);
  }
}
