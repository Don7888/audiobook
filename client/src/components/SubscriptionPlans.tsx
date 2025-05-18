import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface SubscriptionPlan {
  price: number;
  maxStories: number;
  allowSoundEffects: boolean;
  maxAudioLength: number;
  description: string;
}

interface SubscriptionPlansProps {
  currentTier?: string;
  onUpgrade?: (tier: string) => void;
}

export default function SubscriptionPlans({ currentTier = 'basic', onUpgrade }: SubscriptionPlansProps) {
  const { toast } = useToast();
  
  // Fetch subscription plans from backend
  const { data: plans, isLoading, error } = useQuery<Record<string, SubscriptionPlan>>({
    queryKey: ['/api/subscription-plans'],
    queryFn: async () => {
      const response = await fetch('/api/subscription-plans');
      if (!response.ok) throw new Error('Failed to fetch subscription plans');
      return response.json();
    }
  });

  // Handle upgrade button click
  const handleUpgrade = (tier: string) => {
    if (onUpgrade) {
      onUpgrade(tier);
    } else {
      toast({
        title: 'Subscription upgrade',
        description: `You selected the ${tier} plan. This feature is not fully implemented yet.`,
      });
    }
  };

  if (isLoading) {
    return <div className="text-center py-12">Loading subscription plans...</div>;
  }

  if (error || !plans) {
    return (
      <div className="text-center py-12 text-red-500">
        Failed to load subscription plans. Please try again later.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="font-heading font-bold text-3xl mb-2">Choose Your Plan</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Select the plan that best fits your storytelling needs
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {Object.entries(plans).map(([tier, plan]) => (
          <Card 
            key={tier}
            className={`relative overflow-hidden ${
              tier === currentTier 
                ? 'border-primary border-2 shadow-lg' 
                : 'shadow-md hover:shadow-lg transition-shadow'
            }`}
          >
            {tier === currentTier && (
              <div className="absolute top-0 right-0 bg-primary text-white text-xs py-1 px-3 rounded-bl-lg">
                CURRENT PLAN
              </div>
            )}
            
            {tier === 'premium' && (
              <div className="absolute top-0 left-0 w-full bg-purple text-white text-center text-sm py-1">
                MOST POPULAR
              </div>
            )}
            
            <CardHeader className="text-center pt-8">
              <CardTitle className="font-heading capitalize text-2xl mb-2">{tier}</CardTitle>
              <div className="text-3xl font-bold mb-1">
                ${plan.price}
                <span className="text-sm font-normal text-gray-500">/month</span>
              </div>
              <p className="text-gray-600 text-sm">{plan.description}</p>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                <li className="flex items-center">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center bg-green-100 text-green-600 mr-2">
                    <Check size={14} />
                  </div>
                  <span>
                    {plan.maxStories === -1 ? 'Unlimited' : plan.maxStories} stories
                  </span>
                </li>
                <li className="flex items-center">
                  {plan.allowSoundEffects ? (
                    <div className="w-6 h-6 rounded-full flex items-center justify-center bg-green-100 text-green-600 mr-2">
                      <Check size={14} />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full flex items-center justify-center bg-red-100 text-red-500 mr-2">
                      <X size={14} />
                    </div>
                  )}
                  <span>Sound Effects</span>
                </li>
                <li className="flex items-center">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center bg-green-100 text-green-600 mr-2">
                    <Check size={14} />
                  </div>
                  <span>Up to {Math.floor(plan.maxAudioLength / 60)} min audio</span>
                </li>
                <li className="flex items-center">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center bg-green-100 text-green-600 mr-2">
                    <Check size={14} />
                  </div>
                  <span>Yoto, Toni, Audible export</span>
                </li>
              </ul>
            </CardContent>
            
            <CardFooter className="pb-8">
              {tier === currentTier ? (
                <Button 
                  className="w-full" 
                  variant="outline"
                  disabled
                >
                  Current Plan
                </Button>
              ) : (
                <Button 
                  className={`w-full ${
                    tier === 'premium' 
                      ? 'bg-purple hover:bg-purple/90 text-white' 
                      : tier === 'pro'
                        ? 'bg-secondary hover:bg-secondary/90 text-white'
                        : ''
                  }`}
                  onClick={() => handleUpgrade(tier)}
                >
                  {tier === 'basic' ? 'Start Free' : 'Upgrade'}
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}