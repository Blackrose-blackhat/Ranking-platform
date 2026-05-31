import { Controller, Post, Body, UseGuards, Request, HttpException, HttpStatus } from "@nestjs/common";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { Role } from "../auth/roles.enum";
import { UsersService, SyncUserDto } from "./users.service";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Post("register")
  async registerUser(@Body() body: any) {
    try {
      const { email, password, role, institutionId, departmentId } = body;
      if (!email || !password) {
        throw new HttpException("Email and password are required", HttpStatus.BAD_REQUEST);
      }
      return await this.usersService.createUser({
        email,
        password,
        role,
        institutionId,
        departmentId,
      });
    } catch (error) {
      throw new HttpException(
        error.message || "Failed to register user",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.INSTITUTION_ADMIN)
  @Post("invite")
  async inviteUser(@Body() body: any) {
    try {
      const { email, role, institutionId, departmentId, redirectTo } = body;
      if (!email) {
        throw new HttpException("Email is required", HttpStatus.BAD_REQUEST);
      }
      return await this.usersService.inviteUser(email, {
        role,
        institutionId,
        departmentId,
      }, redirectTo);
    } catch (error) {
      throw new HttpException(
        error.message || "Failed to invite user",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(SupabaseAuthGuard)
  @Post("sync")
  async syncUser(@Request() req: any, @Body() syncUserDto: SyncUserDto) {
    try {
      const { id, email } = req.user;
      return await this.usersService.syncUser(id, email, syncUserDto);
    } catch (error) {
      throw new HttpException(
        error.message || "Failed to sync user",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
