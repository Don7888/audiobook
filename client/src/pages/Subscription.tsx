import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import SubscriptionPlans from "@/components/SubscriptionPlans";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Crown, CheckCircle2 } from "lucide-react";

export default function Subscription() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  // In a real app, this would be the actual user ID
  const mockUserId = 1;
  
  // Fetch current user data
  const { data: userData, isError } = useQuery({
    queryKey: ['/api/users', mockUserId],
    queryFn: async () => {
      // In a real app with auth, we'd fetch the current user
      // For now, mock a user with basic subscription
      return {
        id: mockUserId,
        username: "demo_user",
        subscriptionTier: "basic",
        createdAt: new Date().toISOString()
      };
    }
  });

  const handleUpgrade = async (tier: string) => {
    if (!userData) {
      toast({
        title: "Error",
        description: "User data not available. Please try again later.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      // This would normally show a payment form
      // For the demo, we'll just update the subscription directly
      await apiRequest("PATCH", `/api/users/${userData.id}/subscription`, {
        subscriptionTier: tier
      });
      
      // Invalidate user data and auth user data to refresh both
      queryClient.invalidateQueries({ queryKey: ['/api/users', userData.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      
      toast({
        title: "Subscription Updated",
        description: `Your plan has been upgraded to ${tier}. Enjoy your new features!`,
      });
      
      // Show a success message specific to the tier
      if (tier === "pro") {
        toast({
          title: "Sound Effects Unlocked!",
          description: "You can now add sound effects to your stories. Try it out!",
        });
      } else if (tier === "premium") {
        toast({
          title: "All Features Unlocked!",
          description: "You now have unlimited stories and all premium features.",
        });
      }
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update subscription. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Subscription Plans - StoryTunes</title>
        <meta name="description" content="Choose a subscription plan to create more stories with advanced features like sound effects and longer audiobooks." />
      </Helmet>
      <div className="bg-light min-h-screen py-12">
        <div className="container mx-auto px-4">
          {userData && (
            <div className="mb-10 bg-white rounded-2xl p-6 shadow-md">
              <div className="flex flex-col md:flex-row items-center justify-between">
                <div className="flex items-center mb-4 md:mb-0">
                  <div className={`w-12 h-12 rounded-full ${
                    userData.subscriptionTier === 'premium' 
                      ? 'bg-purple text-white' 
                      : userData.subscriptionTier === 'pro' 
                        ? 'bg-secondary text-white' 
                        : 'bg-gray-100 text-gray-600'
                  } flex items-center justify-center mr-4`}>
                    <Crown size={24} />
                  </div>
                  <div>
                    <h2 className="font-heading font-bold text-xl">Current Plan: <span className="capitalize">{userData.subscriptionTier}</span></h2>
                    <p className="text-gray-600">
                      {userData.subscriptionTier === 'basic' && 'Free tier with up to 3 stories'}
                      {userData.subscriptionTier === 'pro' && 'Pro tier with sound effects and up to 50 stories'}
                      {userData.subscriptionTier === 'premium' && 'Premium tier with unlimited stories and all features'}
                    </p>
                  </div>
                </div>
                {userData.subscriptionTier !== 'basic' && (
                  <div className="flex items-center text-green-600">
                    <CheckCircle2 className="mr-2" size={20} />
                    <span className="font-medium">Active Subscription</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <SubscriptionPlans 
            currentTier={userData?.subscriptionTier} 
            onUpgrade={handleUpgrade} 
          />
          
          <div className="mt-12 text-center">
            <Button 
              onClick={() => window.location.href = '/'}
              variant="outline"
              className="border-2 border-primary text-primary hover:bg-primary hover:text-white"
            >
              Return to Home
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}