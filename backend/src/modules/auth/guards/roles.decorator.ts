import type { UserRole } from '#app/modules/user/entities/user.entity';
import { Reflector } from '@nestjs/core';

export const Roles = Reflector.createDecorator<UserRole[]>();
