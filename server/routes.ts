import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage, SavedPrompt, SavedPersona } from "./storage";
import { generateContent } from "./openai";
import { GeneratedContent, InsertGeneratedContent } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // OpenAI content generation endpoint
  app.post("/api/generate", generateContent);

  // Prompt Library API Routes
  app.get("/api/prompts", async (_req: Request, res: Response) => {
    try {
      const prompts = await storage.getPrompts();
      res.json(prompts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch prompts" });
    }
  });

  app.get("/api/prompts/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const prompt = await storage.getPrompt(id);
      
      if (!prompt) {
        return res.status(404).json({ error: "Prompt not found" });
      }
      
      res.json(prompt);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch prompt" });
    }
  });

  app.post("/api/prompts", async (req: Request, res: Response) => {
    try {
      const { name, systemPrompt, userPrompt } = req.body;
      
      if (!name) {
        return res.status(400).json({ error: "Prompt name is required" });
      }
      
      if (!systemPrompt && !userPrompt) {
        return res.status(400).json({ error: "Either system prompt or user prompt must be provided" });
      }
      
      const savedPrompt = await storage.savePrompt({
        name,
        systemPrompt,
        userPrompt
      });
      
      res.status(201).json(savedPrompt);
    } catch (error) {
      res.status(500).json({ error: "Failed to save prompt" });
    }
  });

  app.put("/api/prompts/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, systemPrompt, userPrompt } = req.body;
      
      if (!name && !systemPrompt && !userPrompt) {
        return res.status(400).json({ error: "At least one field must be provided for update" });
      }
      
      const updatedPrompt = await storage.updatePrompt(id, {
        ...(name && { name }),
        ...(systemPrompt !== undefined && { systemPrompt }),
        ...(userPrompt !== undefined && { userPrompt })
      });
      
      if (!updatedPrompt) {
        return res.status(404).json({ error: "Prompt not found" });
      }
      
      res.json(updatedPrompt);
    } catch (error) {
      res.status(500).json({ error: "Failed to update prompt" });
    }
  });

  app.delete("/api/prompts/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await storage.deletePrompt(id);
      
      if (!result) {
        return res.status(404).json({ error: "Prompt not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete prompt" });
    }
  });

  // Persona Library API Routes
  app.get("/api/personas", async (_req: Request, res: Response) => {
    try {
      const personas = await storage.getPersonas();
      res.json(personas);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch personas" });
    }
  });

  app.get("/api/personas/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const persona = await storage.getPersona(id);
      
      if (!persona) {
        return res.status(404).json({ error: "Persona not found" });
      }
      
      res.json(persona);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch persona" });
    }
  });

  app.post("/api/personas", async (req: Request, res: Response) => {
    try {
      const { name, description, instruction } = req.body;
      
      if (!name || !instruction) {
        return res.status(400).json({ error: "Name and instruction are required" });
      }
      
      const savedPersona = await storage.savePersona({
        name,
        description: description || "",
        instruction
      });
      
      res.status(201).json(savedPersona);
    } catch (error) {
      res.status(500).json({ error: "Failed to save persona" });
    }
  });

  app.put("/api/personas/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, description, instruction } = req.body;
      
      if (!name && !description && !instruction) {
        return res.status(400).json({ error: "At least one field must be provided for update" });
      }
      
      const updatedPersona = await storage.updatePersona(id, {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(instruction && { instruction })
      });
      
      if (!updatedPersona) {
        return res.status(404).json({ error: "Persona not found" });
      }
      
      res.json(updatedPersona);
    } catch (error) {
      res.status(500).json({ error: "Failed to update persona" });
    }
  });

  app.delete("/api/personas/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await storage.deletePersona(id);
      
      if (!result) {
        return res.status(404).json({ error: "Persona not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete persona" });
    }
  });

  // Generated Content API Routes
  app.get("/api/generated-contents", async (_req: Request, res: Response) => {
    try {
      const contents = await storage.getGeneratedContents();
      res.json(contents);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch generated contents" });
    }
  });

  app.get("/api/generated-contents/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }
      
      const content = await storage.getGeneratedContent(id);
      
      if (!content) {
        return res.status(404).json({ error: "Generated content not found" });
      }
      
      res.json(content);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch generated content" });
    }
  });

  app.post("/api/generated-contents", async (req: Request, res: Response) => {
    try {
      const { title, content, systemPrompt, userPrompt, model, temperature, metadata } = req.body;
      
      if (!title || !content) {
        return res.status(400).json({ error: "Title and content are required" });
      }
      
      const savedContent = await storage.saveGeneratedContent({
        title,
        content,
        systemPrompt: systemPrompt || null,
        userPrompt: userPrompt || null,
        model: model || null,
        temperature: temperature?.toString() || null,
        metadata: metadata || null,
      });
      
      res.status(201).json(savedContent);
    } catch (error) {
      res.status(500).json({ error: "Failed to save generated content" });
    }
  });

  app.put("/api/generated-contents/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }
      
      const { title, content, systemPrompt, userPrompt, model, temperature, metadata } = req.body;
      
      if (!title && !content) {
        return res.status(400).json({ error: "At least title or content must be provided for update" });
      }
      
      const updatedContent = await storage.updateGeneratedContent(id, {
        ...(title && { title }),
        ...(content && { content }),
        ...(systemPrompt !== undefined && { systemPrompt }),
        ...(userPrompt !== undefined && { userPrompt }),
        ...(model !== undefined && { model }),
        ...(temperature !== undefined && { temperature: temperature?.toString() }),
        ...(metadata !== undefined && { metadata }),
      });
      
      if (!updatedContent) {
        return res.status(404).json({ error: "Generated content not found" });
      }
      
      res.json(updatedContent);
    } catch (error) {
      res.status(500).json({ error: "Failed to update generated content" });
    }
  });

  app.delete("/api/generated-contents/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }
      
      const result = await storage.deleteGeneratedContent(id);
      
      if (!result) {
        return res.status(404).json({ error: "Generated content not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete generated content" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
