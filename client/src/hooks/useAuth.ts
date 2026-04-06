import { useQuery } from "@tanstack/react-query";

export interface AuthUser {
  id: string;
  email: string;
  subscriptionTier: string;
  subscriptionStatus: string;
  mfaEnabled: number;
  homeState: string | null;
  emailVerified: boolean;
}

export function useAuth() {
  const { data: user, isLoading } = useQuery<AuthUser | null>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  return {
    user: user ?? null,
    isLoading,
    isAuthenticated: !!user,
  };
}
