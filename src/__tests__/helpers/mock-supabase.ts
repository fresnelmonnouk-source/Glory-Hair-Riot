import type { TRPCContext } from '@/server/trpc/context';

type MockQuery = {
  data?: unknown;
  error?: { message: string } | null;
  count?: number | null;
};

export function createMockSupabase(defaults: MockQuery = { data: null, error: null }) {
  const chain = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    not: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue(defaults),
    then: jest.fn(),
  };

  const mockFrom = jest.fn().mockReturnValue({
    ...chain,
    select: jest.fn((_, opts?: { count?: string }) =>
      opts?.count
        ? { ...chain, then: undefined, [Symbol.toPrimitive]: undefined }
        : chain
    ),
  });

  const supabase = {
    from: mockFrom,
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
    },
  };

  return supabase as unknown as TRPCContext['supabase'];
}

export function createMockUser(
  overrides: Partial<{ id: string; email: string }> = {}
): NonNullable<TRPCContext['user']> {
  return {
    id: overrides.id ?? 'user-test-uuid-1234',
    email: overrides.email ?? 'test@gloryhair.fr',
    aud: 'authenticated',
    role: 'authenticated',
    created_at: '2026-01-01T00:00:00Z',
    // Champs manquants du type Supabase `User` complet : un mock de test
    // n'a pas besoin de les fournir, d'où le cast plutôt qu'un objet complet.
  } as unknown as NonNullable<TRPCContext['user']>;
}

export function createMockContext(
  overrides: Partial<TRPCContext> = {}
): TRPCContext {
  return {
    user: null,
    supabase: createMockSupabase(),
    ...overrides,
  };
}
