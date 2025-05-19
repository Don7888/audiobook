import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';

export default function SignUp() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [subscriptionTier, setSubscriptionTier] = useState('basic');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  // Fetch subscription plans
  const { data: plans, isLoading: isLoadingPlans } = useQuery<Record<string, any>>({
    queryKey: ['/api/subscription-plans'],
    queryFn: async () => {
      const response = await fetch('/api/subscription-plans');
      if (!response.ok) throw new Error('Failed to fetch subscription plans');
      return response.json();
    }
  });

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password || !confirmPassword) {
      toast({
        title: "Missing information",
        description: "Please fill out all fields",
        variant: "destructive"
      });
      return;
    }
    
    if (password !== confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "Passwords do not match",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Log the subscription tier being used for registration
      console.log("Registering with subscription tier:", subscriptionTier);
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          username, 
          password, 
          subscriptionTier 
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Account created!",
          description: `Your account with ${subscriptionTier} plan has been created successfully.`,
        });
        
        // Redirect to sign-in page
        window.location.href = '/signin';
      } else {
        toast({
          title: "Sign up failed",
          description: data.message || "There was a problem creating your account",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Sign up failed",
        description: "There was a problem creating your account",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Create an Account</CardTitle>
        <CardDescription>
          Sign up to create and save your own stories
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSignUp}>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="johndoe"
                autoComplete="username"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="subscriptionTier">Subscription Plan</Label>
              <Select
                value={subscriptionTier}
                onValueChange={setSubscriptionTier}
              >
                <SelectTrigger id="subscriptionTier">
                  <SelectValue placeholder="Select a plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans && Object.entries(plans).map(([tier, plan]) => (
                    <SelectItem key={tier} value={tier}>
                      {tier.charAt(0).toUpperCase() + tier.slice(1)} - ${plan.price}/mo
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {plans && subscriptionTier && (
                <p className="text-sm text-muted-foreground mt-1">
                  {plans[subscriptionTier]?.description}
                </p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading || isLoadingPlans}>
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col items-center justify-between space-y-2">
        <div className="text-sm text-muted-foreground">
          Already have an account? <a href="/signin" className="text-primary hover:underline">Sign In</a>
        </div>
      </CardFooter>
    </Card>
  );
}