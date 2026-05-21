import { authRouter } from '@/server/trpc/routers/auth';
import { createMockContext, createMockUser } from '../helpers/mock-supabase';

describe('authRouter', () => {
  describe('getSession', () => {
    it('retourne null quand non authentifié', async () => {
      const ctx = createMockContext({ user: null });
      const caller = authRouter.createCaller(ctx);
      const result = await caller.getSession();
      expect(result.user).toBeNull();
    });

    it('retourne le user quand authentifié', async () => {
      const user = createMockUser();
      const ctx = createMockContext({ user: user as any });
      const caller = authRouter.createCaller(ctx);
      const result = await caller.getSession();
      expect(result.user?.id).toBe(user.id);
      expect(result.user?.email).toBe(user.email);
    });
  });

  describe('signOut', () => {
    it('lève une erreur si non authentifié', async () => {
      const ctx = createMockContext({ user: null });
      const caller = authRouter.createCaller(ctx);
      await expect(caller.signOut()).rejects.toThrow('Not authenticated');
    });

    it('appelle supabase.auth.signOut si authentifié', async () => {
      const user = createMockUser();
      const ctx = createMockContext({ user: user as any });
      (ctx.supabase.auth.signOut as jest.Mock).mockResolvedValue({ error: null });

      const caller = authRouter.createCaller(ctx);
      const result = await caller.signOut();

      expect(ctx.supabase.auth.signOut).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });
  });

  describe('getProfile', () => {
    it('retourne null si non authentifié', async () => {
      const ctx = createMockContext({ user: null });
      const caller = authRouter.createCaller(ctx);
      const result = await caller.getProfile();
      expect(result).toBeNull();
    });

    it('retourne le profil de base si authentifié', async () => {
      const user = createMockUser({ id: 'abc-123', email: 'user@test.fr' });
      const ctx = createMockContext({ user: user as any });
      const caller = authRouter.createCaller(ctx);
      const result = await caller.getProfile();

      expect(result).not.toBeNull();
      expect(result?.id).toBe('abc-123');
      expect(result?.email).toBe('user@test.fr');
    });
  });
});
