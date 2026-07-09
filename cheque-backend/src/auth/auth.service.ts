import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(username: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials matching registry profiles.');
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials matching registry profiles.');
    }

    const payload = { sub: user.id, username: user.username, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: { username: user.username, role: user.role },
    };
  }

  // Quick utility to seed default profiles if none exist
  async onModuleInit() {
    const count = await this.prisma.user.count();
    if (count === 0) {
      const adminPassword = await bcrypt.hash('admin123', 10);
      const userPassword = await bcrypt.hash('user123', 10);

      await this.prisma.user.createMany({
        data: [
          { username: 'admin', password: adminPassword, role: 'ADMIN' },
          { username: 'accountant', password: userPassword, role: 'USER' },
        ],
      });
      console.log('[Security Engine] Initialized default user profiles.');
    }
  }
}