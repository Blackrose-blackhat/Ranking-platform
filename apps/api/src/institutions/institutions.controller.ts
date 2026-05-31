import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import {
  InstitutionsService,
  CreateInstitutionDto,
  CreateDepartmentDto,
} from "./institutions.service";

@Controller("institutions")
@UseGuards(SupabaseAuthGuard)
export class InstitutionsController {
  constructor(private readonly service: InstitutionsService) {}

  @Post()
  async create(@Body() dto: CreateInstitutionDto) {
    try {
      return await this.service.createInstitution(dto);
    } catch (e: any) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get()
  async list() {
    return this.service.listInstitutions();
  }

  @Get(":id")
  async get(@Param("id") id: string) {
    try {
      return await this.service.getInstitution(id);
    } catch (e: any) {
      throw new HttpException(e.message, HttpStatus.NOT_FOUND);
    }
  }

  @Post(":id/departments")
  async createDepartment(
    @Param("id") institutionId: string,
    @Body() dto: Omit<CreateDepartmentDto, "institution_id">,
  ) {
    try {
      return await this.service.createDepartment({
        ...dto,
        institution_id: institutionId,
      });
    } catch (e: any) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get(":id/departments")
  async listDepartments(@Param("id") institutionId: string) {
    return this.service.listDepartments(institutionId);
  }
}
