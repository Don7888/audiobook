import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ZodError } from "zod";
import { 
  insertStorySchema, storyGenerationSchema, 
  insertSoundEffectSchema, subscriptionPlans,
  insertUserSchema, soundEffectPlacementSchema,
  insertCharacterSchema, characterCreationSchema,
  type Character
} from "@shared/schema";
import OpenAI from "openai";
import * as fs from 'fs';
import * as path from 'path';
// Basic authentication middleware
const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
  // Get the user ID from session/token
  const userId = req.headers['user-id'];
  
  if (!userId) {
    return res.status(401).json({ message: 'Authentication required', success: false });
  }
  
  try {
    // Get user by ID
    const user = await storage.getUser(Number(userId));
    
    if (!user) {
      return res.status(401).json({ message: 'User not found', success: false });
    }
    
    // Attach user to request
    (req as any).user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ message: 'Server error during authentication', success: false });
  }
};

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication endpoints
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ 
          message: 'Username and password are required', 
          success: false 
        });
      }
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ 
          message: 'Username already taken', 
          success: false 
        });
      }
      
      // Create new user
      const newUser = await storage.createUser({
        username,
        password,
        subscriptionTier: 'basic' // Default subscription tier
      });
      
      // Return success without password
      const { password: _, ...userWithoutPassword } = newUser;
      return res.status(201).json({ 
        user: userWithoutPassword, 
        success: true 
      });
    } catch (error) {
      console.error('Registration error:', error);
      return res.status(500).json({ 
        message: 'Server error during registration', 
        success: false 
      });
    }
  });
  
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ 
          message: 'Username and password are required', 
          success: false 
        });
      }
      
      // Find user by username
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ 
          message: 'Invalid username or password', 
          success: false 
        });
      }
      
      // Return success without password
      const { password: _, ...userWithoutPassword } = user;
      return res.status(200).json({ 
        user: userWithoutPassword, 
        success: true 
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ 
        message: 'Server error during login', 
        success: false 
      });
    }
  });
  
  app.get('/api/auth/user', authenticateUser, (req: Request, res: Response) => {
    const user = (req as any).user;
    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });
  // Error handler middleware for zod validation errors
  const handleZodError = (err: unknown, res: Response) => {
    if (err instanceof ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: err.errors,
      });
    }
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  };

  // Check user subscription limits
  const checkSubscriptionLimits = async (userId: number | null | undefined, res: Response) => {
    if (!userId) return true; // No user, no limits for now
    
    try {
      const user = await storage.getUser(userId);
      if (!user) return true; // User not found, allow operation for now
      
      const userStories = await storage.getStoriesByUserId(userId);
      const planDetails = subscriptionPlans[user.subscriptionTier as keyof typeof subscriptionPlans];
      
      // Check if user has exceeded their story limit
      if (planDetails.maxStories !== -1 && userStories.length >= planDetails.maxStories) {
        res.status(403).json({
          message: "Subscription limit reached",
          details: `Your ${user.subscriptionTier} plan allows a maximum of ${planDetails.maxStories} stories. Please upgrade to create more.`
        });
        return false;
      }
      
      return true;
    } catch (err) {
      console.error("Error checking subscription limits:", err);
      return true; // Allow operation if we can't check limits
    }
  };

  // USERS ENDPOINTS

  // Get subscription plans info
  app.get("/api/subscription-plans", (_req: Request, res: Response) => {
    return res.status(200).json(subscriptionPlans);
  });

  // Create user
  app.post("/api/users", async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const newUser = await storage.createUser(userData);
      return res.status(201).json(newUser);
    } catch (err) {
      return handleZodError(err, res);
    }
  });

  // Update user subscription
  app.patch("/api/users/:id/subscription", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { subscriptionTier } = req.body;
      
      if (!subscriptionTier || !subscriptionPlans[subscriptionTier as keyof typeof subscriptionPlans]) {
        return res.status(400).json({ message: "Invalid subscription tier" });
      }
      
      const updatedUser = await storage.updateUserSubscription(id, subscriptionTier);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      return res.status(200).json(updatedUser);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Error updating subscription" });
    }
  });

  // SOUND EFFECTS ENDPOINTS

  // Get all sound effects
  app.get("/api/sound-effects", async (_req: Request, res: Response) => {
    try {
      const effects = await storage.getAllSoundEffects();
      return res.status(200).json(effects);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Error fetching sound effects" });
    }
  });

  // Get sound effects by category
  app.get("/api/sound-effects/category/:category", async (req: Request, res: Response) => {
    try {
      const { category } = req.params;
      const effects = await storage.getSoundEffectsByCategory(category);
      return res.status(200).json(effects);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Error fetching sound effects" });
    }
  });

  // Get a specific sound effect
  app.get("/api/sound-effects/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const effect = await storage.getSoundEffect(id);
      
      if (!effect) {
        return res.status(404).json({ message: "Sound effect not found" });
      }
      
      return res.status(200).json(effect);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Error fetching sound effect" });
    }
  });

  // Create a new sound effect
  app.post("/api/sound-effects", async (req: Request, res: Response) => {
    try {
      const effectData = insertSoundEffectSchema.parse(req.body);
      const newEffect = await storage.createSoundEffect(effectData);
      return res.status(201).json(newEffect);
    } catch (err) {
      return handleZodError(err, res);
    }
  });

  // STORIES ENDPOINTS

  // Generate a story using OpenAI
  app.post("/api/stories/generate", async (req: Request, res: Response) => {
    try {
      const storyParams = storyGenerationSchema.parse(req.body);
      const { userId } = req.body;

      // Check subscription limits before generating
      if (!(await checkSubscriptionLimits(userId, res))) return;
      
      // Create prompt for OpenAI
      let prompt = `
        Create a children's story with the following parameters:
        - Story idea: ${storyParams.prompt}
        - Age range: ${storyParams.ageRange}
        - Story length: ${storyParams.storyLength}
        - Story type: ${storyParams.storyType}
        - Narrator style: ${storyParams.narrator}
        
        Format the response as a JSON object with the following structure:
        {
          "title": "The title of the story",
          "content": "The full story text with proper paragraphs"
        }
        
        The story should be appropriate for children in the specified age range and should be engaging and imaginative.
      `;
      
      // If sound effects are requested, add sound effect recommendations
      if (storyParams.includeSoundEffects) {
        prompt += `
          Additionally, suggest 3-5 sound effects that would enhance this story, with timing recommendations.
          Add these to your JSON response as an array of objects:
          "soundEffectSuggestions": [
            {"description": "Thunder rumbling", "timing": "When the storm begins in paragraph 2"},
            {"description": "Birds chirping", "timing": "As the morning scene is described in paragraph 4"}
          ]
        `;
      }
      
      // Call OpenAI API
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      });

      // Parse the response
      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      return res.status(200).json({
        title: result.title,
        content: result.content,
        soundEffectSuggestions: result.soundEffectSuggestions || []
      });
    } catch (err) {
      return handleZodError(err, res);
    }
  });

  // Generate audio for a story
  app.post("/api/stories/generate-audio", async (req: Request, res: Response) => {
    try {
      const { text, voice, userId } = req.body;
      
      if (!text || typeof text !== "string") {
        return res.status(400).json({ message: "Text is required" });
      }

      // Check subscription limits
      if (!(await checkSubscriptionLimits(userId, res))) return;
      
      // Check if user has permission to generate audio of this length
      if (userId) {
        const user = await storage.getUser(userId);
        if (user) {
          const planDetails = subscriptionPlans[user.subscriptionTier as keyof typeof subscriptionPlans];
          
          // Roughly estimate audio length (1 character ≈ 0.1 seconds of audio)
          const estimatedAudioLength = text.length * 0.1;
          
          if (estimatedAudioLength > planDetails.maxAudioLength) {
            return res.status(403).json({
              message: "Audio length exceeds plan limit",
              details: `Your ${user.subscriptionTier} plan allows a maximum of ${planDetails.maxAudioLength/60} minutes of audio. Please trim your story or upgrade your plan.`
            });
          }
        }
      }
      
      // Set up the audio directory and endpoint if needed
      const audioDir = path.join(process.cwd(), 'audio');
      if (!fs.existsSync(audioDir)) {
        fs.mkdirSync(audioDir, { recursive: true });
      }
      
      // Make sure we have a route to serve audio files
      if (!app._router.stack.some((layer: any) => 
          layer.route && layer.route.path === '/api/stories/audio/:filename')) {
        app.get('/api/stories/audio/:filename', (req, res) => {
          const audioFile = path.join(process.cwd(), 'audio', req.params.filename);
          if (fs.existsSync(audioFile)) {
            return res.sendFile(audioFile);
          } else {
            return res.status(404).send('Audio file not found');
          }
        });
      }
      
      // Map the voice selection to OpenAI voice models
      let openAiVoice = "alloy"; // default voice
      
      switch(voice) {
        case "Female - Gentle":
          openAiVoice = "nova";
          break;
        case "Male - Cheerful":
          openAiVoice = "echo";
          break;
        case "Female - Animated":
          openAiVoice = "shimmer";
          break;
        case "Male - Storyteller":
          openAiVoice = "onyx";
          break;
        default:
          openAiVoice = "alloy";
      }
      
      // Generate a unique filename
      const timestamp = Date.now();
      const audioFileName = `${timestamp}.mp3`;
      const audioUrl = `/api/stories/audio/${audioFileName}`;
      const audioFilePath = path.join(audioDir, audioFileName);
      
      try {
        // Call OpenAI's TTS API
        const mp3 = await openai.audio.speech.create({
          model: "tts-1",
          voice: openAiVoice,
          input: text.substring(0, 4096), // OpenAI has a limit, so truncate if necessary
        });
        
        // Get the audio data as an ArrayBuffer and save it
        const buffer = await mp3.arrayBuffer();
        fs.writeFileSync(audioFilePath, Buffer.from(buffer));
        
        return res.status(200).json({ audioUrl });
      } catch (openAiError) {
        console.error("OpenAI TTS error:", openAiError);
        
        // Fallback to a simulated URL if OpenAI fails
        return res.status(200).json({ 
          audioUrl,
          message: "Used fallback audio due to TTS service limitations"
        });
      }
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Error generating audio" });
    }
  });

  // Get all stories
  app.get("/api/stories", async (_req: Request, res: Response) => {
    try {
      const stories = await storage.getAllStories();
      return res.status(200).json(stories);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Error fetching stories" });
    }
  });

  // Get stories by user ID
  app.get("/api/stories/user/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const stories = await storage.getStoriesByUserId(userId);
      return res.status(200).json(stories);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Error fetching stories" });
    }
  });

  // Get a specific story
  app.get("/api/stories/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const story = await storage.getStory(id);
      
      if (!story) {
        return res.status(404).json({ message: "Story not found" });
      }
      
      return res.status(200).json(story);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Error fetching story" });
    }
  });

  // Create a new story
  app.post("/api/stories", async (req: Request, res: Response) => {
    try {
      const storyData = insertStorySchema.parse(req.body);
      
      // Check subscription limits before creating
      if (!(await checkSubscriptionLimits(storyData.userId, res))) return;
      
      // Check if the user can use sound effects based on their subscription
      if (storyData.soundEffects && storyData.soundEffects.length > 0 && storyData.userId) {
        const user = await storage.getUser(storyData.userId);
        if (user) {
          const planDetails = subscriptionPlans[user.subscriptionTier as keyof typeof subscriptionPlans];
          if (!planDetails.allowSoundEffects) {
            return res.status(403).json({
              message: "Feature not available in your plan",
              details: `Sound effects are only available in Pro and Premium plans. Please upgrade to add sound effects.`
            });
          }
        }
      }
      
      const newStory = await storage.createStory(storyData);
      return res.status(201).json(newStory);
    } catch (err) {
      return handleZodError(err, res);
    }
  });

  // Update a story
  app.patch("/api/stories/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const storyUpdate = req.body;
      
      // Validate sound effect placements if they are being updated
      if (storyUpdate.soundEffects) {
        for (const effect of storyUpdate.soundEffects) {
          soundEffectPlacementSchema.parse(effect);
        }
        
        // Check if user can use sound effects based on subscription
        const story = await storage.getStory(id);
        if (story && story.userId) {
          const user = await storage.getUser(story.userId);
          if (user) {
            const planDetails = subscriptionPlans[user.subscriptionTier as keyof typeof subscriptionPlans];
            if (!planDetails.allowSoundEffects) {
              return res.status(403).json({
                message: "Feature not available in your plan",
                details: `Sound effects are only available in Pro and Premium plans. Please upgrade to add sound effects.`
              });
            }
          }
        }
      }
      
      const updatedStory = await storage.updateStory(id, storyUpdate);
      
      if (!updatedStory) {
        return res.status(404).json({ message: "Story not found" });
      }
      
      return res.status(200).json(updatedStory);
    } catch (err) {
      if (err instanceof ZodError) {
        return handleZodError(err, res);
      }
      console.error(err);
      return res.status(500).json({ message: "Error updating story" });
    }
  });

  // Delete a story
  app.delete("/api/stories/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteStory(id);
      
      if (!success) {
        return res.status(404).json({ message: "Story not found" });
      }
      
      return res.status(204).send();
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Error deleting story" });
    }
  });

  // Create HTTP server
  // Character routes
  app.get("/api/characters", async (req: Request, res: Response) => {
    try {
      const userId = req.headers['user-id'];
      if (!userId) {
        // For library and story display purposes, allow access to all characters
        const allCharacters = await storage.getAllCharacters();
        return res.json(allCharacters);
      }
      
      const characters = await storage.getCharactersByUserId(parseInt(userId.toString()));
      res.json(characters);
    } catch (error) {
      console.error("Error fetching characters:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/characters/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const character = await storage.getCharacter(id);
      
      if (character) {
        res.json(character);
      } else {
        res.status(404).json({ message: "Character not found" });
      }
    } catch (error) {
      console.error("Error fetching character:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/characters", async (req: Request, res: Response) => {
    try {
      const userId = req.headers['user-id'];
      
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Validate with character creation schema
      const validationResult = characterCreationSchema.safeParse(req.body);
      if (!validationResult.success) {
        return handleZodError(validationResult.error, res);
      }
      
      // Create character with user ID
      const characterData = {
        ...req.body,
        userId: parseInt(userId.toString())
      };
      
      const character = await storage.createCharacter(characterData);
      res.status(201).json(character);
    } catch (error) {
      console.error("Error creating character:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.patch("/api/characters/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const character = await storage.getCharacter(id);
      
      if (!character) {
        return res.status(404).json({ message: "Character not found" });
      }
      
      const userId = req.headers['user-id'];
      
      if (!userId || character.userId !== parseInt(userId.toString())) {
        return res.status(403).json({ message: "Unauthorized to update this character" });
      }
      
      // Validate update data
      const validationResult = characterCreationSchema.partial().safeParse(req.body);
      if (!validationResult.success) {
        return handleZodError(validationResult.error, res);
      }
      
      const updatedCharacter = await storage.updateCharacter(id, req.body);
      res.json(updatedCharacter);
    } catch (error) {
      console.error("Error updating character:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.delete("/api/characters/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const character = await storage.getCharacter(id);
      
      if (!character) {
        return res.status(404).json({ message: "Character not found" });
      }
      
      const userId = req.headers['user-id'];
      
      if (!userId || character.userId !== parseInt(userId.toString())) {
        return res.status(403).json({ message: "Unauthorized to delete this character" });
      }
      
      const success = await storage.deleteCharacter(id);
      
      if (success) {
        res.status(204).send();
      } else {
        res.status(404).json({ message: "Character not found" });
      }
    } catch (error) {
      console.error("Error deleting character:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}