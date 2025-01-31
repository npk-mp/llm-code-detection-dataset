import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { UserService } from '../services/user.service';
import { AuthGuard } from '@nestjs/passport';
import { UserStatsDto } from '../dto/user-stats.dto';

@Controller('user')
@UseGuards(AuthGuard('jwt'))
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('stats')
  async getUserStats(): Promise<UserStatsDto> {
    try {
      const stats = await this.userService.getUserStats();
      return stats;
    } catch (error) {
      throw new Error('Failed to fetch user statistics');
    }
  }

  @Post('update-preferences')
  async updatePreferences(
    @Body() preferences: any,
    @Param('userId') userId: string,
  ) {
    try {
      const updatedUser = await this.userService.updatePreferences(userId, preferences);
      return {
        success: true,
        user: updatedUser,
      };
    } catch (error) {
      throw new Error('Failed to update user preferences');
    }
  }

  @Get('activity/:userId')
  async getUserActivity(@Param('userId') userId: string) {
    try {
      const activity = await this.userService.getUserActivity(userId);
      return {
        success: true,
        activity,
      };
    } catch (error) {
      throw new Error('Failed to fetch user activity');
    }
  }
}