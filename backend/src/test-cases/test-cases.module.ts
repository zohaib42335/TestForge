import { Module } from '@nestjs/common';
import { TestCasesController } from './test-cases.controller';
import { TestCasesImportService } from './test-cases-import.service';
import { TestCasesService } from './test-cases.service';

@Module({
  controllers: [TestCasesController],
  providers: [TestCasesService, TestCasesImportService],
  exports: [TestCasesService, TestCasesImportService],
})
export class TestCasesModule {}
