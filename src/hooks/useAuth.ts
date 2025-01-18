import { useEffect, useState } from 'react';
import { getCurrentUser } from '../lib/auth';
import type { Database } from '../types/database';

type User = Database['public']['Tables']['users']['Row'];

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getCurrentUser()
      .then(setUser)
      .finally(() => setIsLoading(false));
  }, []);

  return { user, isLoading };
}