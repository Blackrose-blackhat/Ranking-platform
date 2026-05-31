import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { TlrService } from "./tlr.service";
import {
  CreateSubmissionDto,
  StudentStrengthDto,
  FacultyStudentRatioDto,
  FacultyQualificationDto,
  FinancialResourcesDto,
  OnlineEducationDto,
  EntryExitIksDto,
  UploadEvidenceDto,
  BulkUploadEvidenceDto,
} from "./dto";

@Controller("tlr")
@UseGuards(SupabaseAuthGuard)
export class TlrController {
  constructor(private readonly tlrService: TlrService) {}

  // ── Submissions ─────────────────────────────

  @Post("submissions")
  async createSubmission(@Body() dto: CreateSubmissionDto, @Request() req: any) {
    try {
      return await this.tlrService.createSubmission(dto, req.user.id);
    } catch (e: any) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get("submissions")
  async listSubmissions(@Query("institution_id") institutionId?: string) {
    return this.tlrService.listSubmissions(institutionId);
  }

  @Get("submissions/:id")
  async getSubmission(@Param("id") id: string) {
    try {
      return await this.tlrService.getSubmission(id);
    } catch (e: any) {
      throw new HttpException(e.message, HttpStatus.NOT_FOUND);
    }
  }

  // ── Sub-parameter Updates ───────────────────

  @Put("submissions/:id/ss")
  async updateSS(@Param("id") id: string, @Body() dto: StudentStrengthDto) {
    try {
      return await this.tlrService.updateStudentStrength(id, dto);
    } catch (e: any) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Put("submissions/:id/fsr")
  async updateFSR(@Param("id") id: string, @Body() dto: FacultyStudentRatioDto) {
    try {
      return await this.tlrService.updateFacultyStudentRatio(id, dto);
    } catch (e: any) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Put("submissions/:id/fqe")
  async updateFQE(@Param("id") id: string, @Body() dto: FacultyQualificationDto) {
    try {
      return await this.tlrService.updateFacultyQualification(id, dto);
    } catch (e: any) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Put("submissions/:id/fru")
  async updateFRU(@Param("id") id: string, @Body() dto: FinancialResourcesDto) {
    try {
      return await this.tlrService.updateFinancialResources(id, dto);
    } catch (e: any) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Put("submissions/:id/oe")
  async updateOE(@Param("id") id: string, @Body() dto: OnlineEducationDto) {
    try {
      return await this.tlrService.updateOnlineEducation(id, dto);
    } catch (e: any) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Put("submissions/:id/mir")
  async updateMIR(@Param("id") id: string, @Body() dto: EntryExitIksDto) {
    try {
      return await this.tlrService.updateEntryExitIks(id, dto);
    } catch (e: any) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }

  // ── Evidence ────────────────────────────────

  @Post("submissions/:id/evidence")
  async uploadEvidence(
    @Param("id") id: string,
    @Body() dto: UploadEvidenceDto,
    @Request() req: any,
  ) {
    try {
      return await this.tlrService.uploadEvidence(id, dto, req.user.id);
    } catch (e: any) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post("submissions/:id/evidence/bulk")
  async bulkUploadEvidence(
    @Param("id") id: string,
    @Body() dto: BulkUploadEvidenceDto,
    @Request() req: any,
  ) {
    try {
      return await this.tlrService.bulkUploadEvidence(id, dto, req.user.id);
    } catch (e: any) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get("submissions/:id/evidence")
  async listEvidence(@Param("id") id: string) {
    return this.tlrService.listEvidence(id);
  }

  @Post("submissions/:id/upload-url")
  async getUploadUrl(
    @Param("id") id: string,
    @Body("fileName") fileName: string,
  ) {
    try {
      return await this.tlrService.getUploadUrl(id, fileName);
    } catch (e: any) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }

  // ── Score & Submit ──────────────────────────

  @Post("submissions/:id/calculate")
  async calculateScores(@Param("id") id: string) {
    try {
      return await this.tlrService.calculateScores(id);
    } catch (e: any) {
      throw new HttpException(e.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post("submissions/:id/submit")
  async submitForReview(@Param("id") id: string) {
    try {
      return await this.tlrService.submitForReview(id);
    } catch (e: any) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }

  // ── Report ──────────────────────────────────

  @Get("submissions/:id/report")
  async getReport(@Param("id") id: string) {
    try {
      return await this.tlrService.generateReport(id);
    } catch (e: any) {
      throw new HttpException(e.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
