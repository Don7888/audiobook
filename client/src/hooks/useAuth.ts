import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

export interface AuthUser {
  id: number;
  username: string;
  subscriptionTier: string;
}

export function useAuth() {
  const [userId, setUserId] = useState<number | null>(
    localStorage.getItem("userId") ? Number(localStorage.getItem("userId")) : null
  );
  
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      if (!userId) return null;
      
      try {
        const response = await fetch('/api/auth/user', {
          headers: {
            'user-id': userId.toString(),
          }
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            // User is not authenticated
            localStorage.removeItem("userId");
            setUserId(null);
            return null;
          }
          throw new Error('Failed to fetch user data');
        }
        
        return await response.json();
      } catch (error) {
        console.error("Auth error:", error);
        return null;
      }
    },
    enabled: !!userId,
    staleTime: 60000, // 1 minute
    retryOnMount: true,
    refetchOnWindowFocus: true
  });
  
  const login = (userData: { id: number }) => {
    localStorage.setItem("userId", userData.id.toString());
    setUserId(userData.id);
  };
  
  const logout = () => {
    localStorage.removeItem("userId");
    setUserId(null);
  };
  
  return {
    user,
    userId,
    isLoading,
    isAuthenticated: !!user && !!userId,
    login,
    logout,
  };
}