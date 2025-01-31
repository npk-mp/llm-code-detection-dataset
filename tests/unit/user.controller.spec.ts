import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from '../../backend/controllers/user.controller';
import { UserService } from '../../backend/services/user.service';
import { createMock } from '@golevelup/ts-jest';

describe('UserController', () => {
  let controller: UserController;
  let userService: jest.Mocked<UserService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: createMock<UserService>({
            getUserStats: jest.fn(),
            updatePreferences: jest.fn(),
            getUserActivity: jest.fn(),
          }),
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    userService = module.get(UserService);
  });

  describe('getUserStats', () => {
    it('should return user statistics', async () => {
      const mockStats = {
        totalOrders: 10,
        recentActivity: [],
        accountBalance: 100.50,
      };

      userService.getUserStats.mockResolvedValue(mockStats);

      const result = await controller.getUserStats();
      expect(result).toEqual(mockStats);
      expect(userService.getUserStats).toHaveBeenCalledTimes(1);
    });

    it('should handle errors', async () => {
      userService.getUserStats.mockRejectedValue(new Error('Database error'));

      await expect(controller.getUserStats()).rejects.toThrow('Failed to fetch user statistics');
    });
  });

  describe('updatePreferences', () => {
    const userId = 'user123';
    const mockPreferences = { theme: 'dark', notifications: true };

    it('should update user preferences', async () => {
      const mockUser = {
        id: userId,
        preferences: mockPreferences,
      };

      userService.updatePreferences.mockResolvedValue(mockUser);

      const result = await controller.updatePreferences(mockPreferences, userId);
      expect(result).toEqual({
        success: true,
        user: mockUser,
      });
      expect(userService.updatePreferences).toHaveBeenCalledWith(userId, mockPreferences);
    });

    it('should handle update errors', async () => {
      userService.updatePreferences.mockRejectedValue(new Error('Update failed'));

      await expect(controller.updatePreferences(mockPreferences, userId))
        .rejects.toThrow('Failed to update user preferences');
    });
  });

  describe('getUserActivity', () => {
    const userId = 'user123';

    it('should return user activity', async () => {
      const mockActivity = [
        { action: 'login', timestamp: new Date() },
        { action: 'purchase', timestamp: new Date() },
      ];

      userService.getUserActivity.mockResolvedValue(mockActivity);

      const result = await controller.getUserActivity(userId);
      expect(result).toEqual({
        success: true,
        activity: mockActivity,
      });
      expect(userService.getUserActivity).toHaveBeenCalledWith(userId);
    });

    it('should handle activity fetch errors', async () => {
      userService.getUserActivity.mockRejectedValue(new Error('Fetch failed'));

      await expect(controller.getUserActivity(userId))
        .rejects.toThrow('Failed to fetch user activity');
    });
  });
});