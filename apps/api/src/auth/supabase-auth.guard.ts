import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as WebSocket from 'ws';
import { Role } from './roles.enum';

// Patch global object so RealtimeClient doesn't crash on Node 20 without native WebSocket
if (typeof global !== 'undefined' && !global.WebSocket) {
  (global as any).WebSocket = WebSocket;
}

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      {
        auth: {
          persistSession: false,
        }
      }
    );
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token with Supabase API
    const { data, error } = await this.supabase.auth.getUser(token);

    if (error || !data?.user) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    // Attach user payload to the request object
    request.user = {
      id: data.user.id,
      email: data.user.email,
      role: data.user.user_metadata?.role || Role.FACULTY,
    };

    return true;
  }
}
