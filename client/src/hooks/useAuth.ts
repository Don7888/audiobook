import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

export interface AuthUser {
  id: number;
  username: string;
  subscriptionTier: string;
}

export function useAuth() {
  // TEMPORARY: Always set userId to 1 for development
  const [userId, setUserId] = useState<number>(1);
  
  // Auto-set the userId in localStorage if not present
  if (!localStorage.getItem("userId")) {
    localStorage.setItem("userId", "1");
  }
  
  // TEMPORARY: Return a default premium user without making actual API calls
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      // Always return a premium user with ID 1
      return {
        id: 1,
        username: "TemporaryUser",
        subscriptionTier: "premium",
        email: "temp@example.com",
        createdAt: new Date(),
        updatedAt: new Date()
      };
    },
    staleTime: 60000, // 1 minute
    retryOnMount: true,
    refetchOnWindowFocus: true
  });
  
  const login = (userData: { id: number }) => {
    localStorage.setItem("userId", userData.id.toString());
    setUserId(userData.id);
  };
  
  // TEMPORARY: Make logout a no-op to prevent accidental logout 
  const logout = () => {
    // No-op in temporary mode - we always stay logged in
    console.log("Logout attempted but ignored in temporary mode");
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