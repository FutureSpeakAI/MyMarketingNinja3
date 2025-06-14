import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useVisualTabPersistence } from "@/contexts/TabPersistenceContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ImagePlus, Save, Library, Trash2, Download, BrainCircuit, MessageSquareText, Copy, ArrowUpRight } from "lucide-react";
import { pageTransition } from "@/App";
import { ContentType } from "@shared/schema";
import { ImagePromptAgent } from "./ImagePromptAgent";
import { ImageProcessor } from "./ImageProcessor";
import { ImageEditor } from "./ImageEditor";
import { ErrorBoundary } from "react-error-boundary";
import { ErrorFallback } from "../ErrorFallback";
import { ModelSelector } from "@/components/ui/ModelSelector";

interface GenerateImageResponse {
  images: Array<{
    url: string;
    revised_prompt?: string;
  }>;
  model: string;
  prompt: string;
}

interface GenerateImageRequest {
  prompt: string;
  model?: string;
  size?: string;
  quality?: string;
  background?: string;
  moderation?: string;
  output_format?: string;
  output_compression?: number;
  reference_images?: Array<{
    image_url: {
      url: string;
      detail?: "auto" | "high" | "low";
    }
  }>;
}

interface VisualTabProps {
  model: string;
  setModel: (model: string) => void;
  onOpenImageLibrary?: () => void;
  variationPrompt?: string | null;
  setVariationPrompt?: (prompt: string | null) => void;
}

// Define TabContent outside the main component to prevent recreation on each render
const TabContent = ({ 
  model, 
  setModel, 
  onOpenImageLibrary, 
  imagePrompt, 
  setImagePrompt,
  generatedImageUrl, 
  setGeneratedImageUrl,
  size, 
  setSize,
  quality, 
  setQuality,
  background, 
  setBackground,
  imageTitle, 
  setImageTitle,
  isProcessingDialogOpen, 
  setIsProcessingDialogOpen,
  generateImageMutation,
  saveImageMutation,
  handleGenerateImage,
  handleSaveImage,
  handlePromptFromAgent,
  handleCreateVariations,
  clearVisualTab
}: {
  model: string;
  setModel: (model: string) => void;
  onOpenImageLibrary?: () => void;
  imagePrompt: string;
  setImagePrompt: (prompt: string) => void;
  generatedImageUrl: string | null;
  setGeneratedImageUrl: (url: string | null) => void;
  size: string;
  setSize: (size: string) => void;
  quality: string;
  setQuality: (quality: string) => void;
  background: string;
  setBackground: (background: string) => void;
  imageTitle: string;
  setImageTitle: (title: string) => void;
  isProcessingDialogOpen: boolean;
  setIsProcessingDialogOpen: (open: boolean) => void;
  generateImageMutation: any;
  saveImageMutation: any;
  handleGenerateImage: () => void;
  handleSaveImage: () => void;
  handlePromptFromAgent: (prompt: string) => void;
  handleCreateVariations: (imageUrl: string) => void;
  clearVisualTab: () => void;
}) => {
  const { toast } = useToast();
  
  return (
    <motion.div
    className="space-y-6"
    initial="hidden"
    animate="visible"
    exit="exit"
    variants={pageTransition}
  >
    {/* Main content tabs */}
    <Tabs defaultValue="standard" className="w-full">
      <div className="flex flex-col sm:flex-row justify-between mb-6">
        <TabsList className="mb-2 sm:mb-0">
          <TabsTrigger value="standard" className="flex items-center">
            <ImagePlus className="mr-2 h-4 w-4" />
            Standard Mode
          </TabsTrigger>
          <TabsTrigger value="assistant" className="flex items-center">
            <BrainCircuit className="mr-2 h-4 w-4" />
            SAGE
          </TabsTrigger>
        </TabsList>
        
        {/* Action Buttons */}
        <div className="flex gap-2 self-start">
          <Button
            variant="outline"
            onClick={onOpenImageLibrary}
            disabled={!onOpenImageLibrary}
          >
            <Library className="mr-2 h-4 w-4" />
            View Image Library
          </Button>
          
          <Button
            variant="outline"
            onClick={() => {
              clearVisualTab();
              toast({
                title: "Visual tab cleared",
                description: "All content has been cleared from the visual tab.",
              });
            }}
            className="text-red-500 border-red-200 hover:bg-red-50"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Clear Tab
          </Button>
        </div>
      </div>
      
      {/* Standard Mode Content */}
      <TabsContent value="standard">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left column - Input controls */}
          <div className="space-y-6">
            <Card className="p-4 shadow-md">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="image-prompt">Image Prompt</Label>
                  <Textarea
                    id="image-prompt"
                    placeholder="Describe the image you want to generate..."
                    className="min-h-[200px] resize-y"
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                  />
                </div>
                
                {/* Reference image uploader removed as gpt-image-1 doesn't support this feature */}
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="model-select">Model</Label>
                    <ModelSelector 
                      value={model} 
                      onValueChange={setModel} 
                      type="image"
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="size-select">Size</Label>
                    <Select value={size} onValueChange={setSize}>
                      <SelectTrigger id="size-select">
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* GPT Image Model only supports these specific sizes */}
                        <SelectItem value="1024x1024">Square (1024×1024)</SelectItem>
                        <SelectItem value="1024x1536">Portrait (1024×1536)</SelectItem>
                        <SelectItem value="1536x1024">Landscape (1536×1024)</SelectItem>
                        <SelectItem value="auto">Auto (AI Chooses)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="quality-select">Quality</Label>
                    <Select value={quality} onValueChange={setQuality}>
                      <SelectTrigger id="quality-select">
                        <SelectValue placeholder="Select quality" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low (Faster)</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High (Best Quality)</SelectItem>
                        <SelectItem value="auto">Auto (AI Chooses)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="background-select">Background</Label>
                    <Select value={background} onValueChange={setBackground}>
                      <SelectTrigger id="background-select">
                        <SelectValue placeholder="Select background" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Auto (AI Chooses)</SelectItem>
                        <SelectItem value="transparent">Transparent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Button 
                  className="w-full bg-[#F15A22] hover:bg-[#e04d15]"
                  onClick={handleGenerateImage}
                  disabled={generateImageMutation.isPending || !imagePrompt.trim()}
                >
                  {generateImageMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <ImagePlus className="mr-2 h-4 w-4" />
                      Generate Image
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </div>
          
          {/* Right column - Output display */}
          <div className="space-y-6">
            <Card className="p-4 shadow-md">
              <div className="space-y-4">
                <Label htmlFor="image-output">Generated Image</Label>
                <div className="min-h-[300px] border rounded-md flex items-center justify-center">
                  {generateImageMutation.isPending ? (
                    <div className="text-center p-6">
                      <Loader2 className="mx-auto h-12 w-12 animate-spin text-[#F15A22]" />
                      <p className="mt-4 text-gray-500">Generating your image...</p>
                      <p className="text-sm text-gray-400">This may take a moment</p>
                    </div>
                  ) : generatedImageUrl ? (
                    <div className="w-full flex flex-col space-y-4">
                      <div className="flex items-center justify-center">
                        <img 
                          src={generatedImageUrl} 
                          alt="Generated" 
                          className="mx-auto max-h-[500px] max-w-full object-contain rounded-md border" 
                          onError={(e) => {
                            console.error("Error loading image:", e);
                            const target = e.target as HTMLImageElement;
                            target.onerror = null; // Prevent infinite loop if error image also fails
                          }}
                        />
                      </div>
                      
                      {/* Mobile-friendly grid layout for buttons */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-500 border-red-200 hover:bg-red-50 w-full"
                          onClick={() => setGeneratedImageUrl(null)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-blue-500 border-blue-200 hover:bg-blue-50 w-full"
                          onClick={() => {
                            if (generatedImageUrl) {
                              const a = document.createElement("a");
                              a.href = generatedImageUrl;
                              a.download = `image_${new Date().getTime()}.png`;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                            }
                          }}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          className="text-purple-500 border-purple-200 hover:bg-purple-50 w-full"
                          onClick={() => handleCreateVariations(generatedImageUrl || '')}
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Variations
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-green-500 border-green-200 hover:bg-green-50 w-full"
                          onClick={() => setIsProcessingDialogOpen(true)}
                        >
                          <ArrowUpRight className="mr-2 h-4 w-4" />
                          Upscale/Convert
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-6 text-gray-500">
                      <ImagePlus className="mx-auto h-12 w-12 opacity-20" />
                      <p className="mt-2">Your generated image will appear here</p>
                    </div>
                  )}
                </div>
                
                {generatedImageUrl && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="image-title">Image Title</Label>
                      <Textarea
                        id="image-title"
                        placeholder="Enter a title for your image..."
                        value={imageTitle}
                        onChange={(e) => setImageTitle(e.target.value)}
                        className="resize-none"
                        rows={1}
                      />
                    </div>
                    
                    <Button 
                      className="w-full bg-[#F15A22] hover:bg-[#e04d15]"
                      onClick={handleSaveImage}
                      disabled={saveImageMutation.isPending || !imageTitle.trim() || !generatedImageUrl}
                    >
                      {saveImageMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save to Library
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </TabsContent>
      
      {/* Prompt Assistant Content */}
      <TabsContent value="assistant">
        <ImagePromptAgent onApplyPrompt={handlePromptFromAgent} model={model} />
      </TabsContent>
    </Tabs>
    
    {/* Image Processing Dialog */}
    <ImageProcessor 
      open={isProcessingDialogOpen}
      onOpenChange={setIsProcessingDialogOpen}
      imageUrl={generatedImageUrl || ''}
    />
  </motion.div>
  );
};

export function VisualTab({ model, setModel, onOpenImageLibrary, variationPrompt, setVariationPrompt }: VisualTabProps) {
  // Use tab persistence for all state
  const { visualState, updateVisualState, clearVisualTab } = useVisualTabPersistence();
  const { toast } = useToast();

  // Create local setters that update the persisted state
  const setImagePrompt = (prompt: string) => updateVisualState({ imagePrompt: prompt });
  const setGeneratedImageUrl = (url: string | null) => updateVisualState({ generatedImageUrl: url });
  const setImageTitle = (title: string) => updateVisualState({ imageTitle: title });
  const setSize = (size: string) => updateVisualState({ size });
  const setQuality = (quality: string) => updateVisualState({ quality });
  const setBackground = (background: string) => updateVisualState({ background });
  const setIsProcessingDialogOpen = (open: boolean) => updateVisualState({ isProcessingDialogOpen: open });
  
  // Image editor state
  const [isImageEditorOpen, setIsImageEditorOpen] = useState(false);
  const [editingImageUrl, setEditingImageUrl] = useState<string>('');
  const [editingImageId, setEditingImageId] = useState<number | undefined>();

  // Extract values from persisted state
  const {
    imagePrompt,
    generatedImageUrl,
    imageTitle,
    size,
    quality,
    background,
    isProcessingDialogOpen
  } = visualState;
  
  // Create a mutation to handle image generation with improved stability
  const generateImageMutation = useMutation({
    mutationFn: async (data: GenerateImageRequest) => {
      try {
        console.log("Starting image generation request with data:", {
          prompt: data.prompt ? data.prompt.substring(0, 50) + "..." : "empty", 
          model: data.model,
          size: data.size,
          quality: data.quality
        });
        
        // Add timeout to prevent hanging requests - increased for gpt-image-1 processing time
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 second timeout for complex image generation
        
        try {
          const response = await apiRequest("POST", "/api/generate-image", data, {
            signal: controller.signal
          });
          
          clearTimeout(timeoutId); // Clear timeout if request completes
          console.log("Image API raw response status:", response.status);
          
          // Additional diagnostics for deployed environment
          if (!response.ok) {
            const errorText = await response.text();
            console.error("Image API error response:", errorText);
            throw new Error(`API error ${response.status}: ${errorText}`);
          }
          
          const jsonData = await response.json();
          console.log("Image API Response parsed successfully:", 
            jsonData.images ? `${jsonData.images.length} images returned` : "No images in response");
            
          return jsonData as GenerateImageResponse;
        } catch (fetchError: any) {
          clearTimeout(timeoutId); // Clear timeout on error
          
          if (fetchError.name === 'AbortError') {
            console.error("Request timed out");
            throw new Error("Request timed out after 2 minutes. Complex images may take longer - please try a simpler prompt or try again.");
          }
          
          throw fetchError;
        }
      } catch (error: any) {
        console.error("Complete image generation error:", error);
        // Enhance error if it's a network issue
        if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
          console.error("Network error details:", {
            url: "/api/generate-image",
            errorName: error.name,
            errorMessage: error.message,
            stack: error.stack
          });
          throw new Error(`Network error: Failed to connect to the server. This could be due to network connectivity issues, CORS restrictions, or the server being unavailable.`);
        }
        throw error;
      }
    },
    onSuccess: (data) => {
      try {
        // Extract image URL from the response
        console.log("Image generation successful:", data);
        if (data.images && data.images.length > 0 && data.images[0].url) {
          const imageUrl = data.images[0].url;
          console.log("Setting image URL:", imageUrl.substring(0, 50) + "...");
          setGeneratedImageUrl(imageUrl);
          
          // Default title from prompt (first 30 chars)
          if (!imageTitle) {
            setImageTitle(imagePrompt.substring(0, 30) + (imagePrompt.length > 30 ? "..." : ""));
          }
          
          try {
            toast({
              title: "Image generated",
              description: "Your image has been successfully generated.",
            });
          } catch (toastErr) {
            console.error("Error showing success toast:", toastErr);
          }
        } else {
          console.error("Unexpected API response format:", data);
          try {
            toast({
              title: "Image generation issue",
              description: "Received successful response but couldn't find image URL. Check console for details.",
              variant: "destructive",
            });
          } catch (toastErr) {
            console.error("Error showing error toast:", toastErr);
          }
        }
      } catch (err) {
        // Catch and log any errors in success handler to prevent app crashes
        console.error("Error in image generation success handler:", err);
      }
    },
    onError: (error: Error) => {
      try {
        console.error("Image generation error:", error);
        toast({
          title: "Image generation failed",
          description: error.message,
          variant: "destructive",
        });
      } catch (toastErr) {
        console.error("Error showing error toast:", toastErr);
      }
    },
    // Disable automatic retries
    retry: false,
  });
  
  const saveImageMutation = useMutation({
    mutationFn: async () => {
      try {
        if (!generatedImageUrl || !imageTitle) {
          throw new Error("Image URL and title are required");
        }
        
        // Process image URL to reduce size if it's a data URL
        let processedImageUrl = generatedImageUrl;
        
        // If it's a base64 data URL, extract the thumbnail version to reduce size
        if (generatedImageUrl.startsWith('data:image')) {
          try {
            // Create a smaller thumbnail version
            const img = new window.Image();
            img.src = generatedImageUrl;
            
            // Wait for image to load with timeout
            await new Promise<void>((resolve, reject) => {
              const timeoutId = setTimeout(() => {
                console.error("Image load timed out");
                reject(new Error("Image loading timed out"));
              }, 5000);
              
              img.onload = () => {
                clearTimeout(timeoutId);
                resolve();
              };
              img.onerror = () => {
                clearTimeout(timeoutId);
                reject(new Error("Failed to load image"));
              };
            });
            
            // Create a canvas to resize the image
            const canvas = document.createElement('canvas');
            // Resize to 300px width while maintaining aspect ratio
            const MAX_WIDTH = 300;
            const scaleFactor = MAX_WIDTH / img.width;
            canvas.width = MAX_WIDTH;
            canvas.height = img.height * scaleFactor;
            
            // Draw image on canvas at reduced size
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              // Get as JPEG with reduced quality (0.6 = 60% quality)
              processedImageUrl = canvas.toDataURL('image/jpeg', 0.6);
            }
          } catch (error) {
            console.error("Error processing image:", error);
            // Fall back to original URL if something goes wrong
          }
        }
        
        // Add request timeout with AbortController
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        try {
          // Always use gpt-image-1 model
          const response = await apiRequest("POST", "/api/generated-images", {
            title: imageTitle,
            prompt: imagePrompt,
            imageUrl: processedImageUrl, // Use the reduced size image
            model: "gpt-image-1",
            size,
            quality,
            background: background,
            metadata: JSON.stringify({ 
              savedAt: new Date().toISOString(),
              isVariation: imagePrompt.toLowerCase().includes("variation") 
            })
          }, { signal: controller.signal });
          
          clearTimeout(timeoutId);
          return response.json();
        } catch (fetchError: any) {
          clearTimeout(timeoutId);
          if (fetchError.name === 'AbortError') {
            console.error("Save image request timed out");
            throw new Error("Request timed out after 30 seconds. Please try again.");
          }
          throw fetchError;
        }
      } catch (error) {
        console.error("Complete error in save image mutation:", error);
        throw error;
      }
    },
    onSuccess: () => {
      try {
        toast({
          title: "Image saved",
          description: "Your image has been saved to the library.",
        });
      } catch (err) {
        console.error("Error showing success toast:", err);
      }
    },
    onError: (error: Error) => {
      try {
        console.error("Failed to save image:", error);
        toast({
          title: "Failed to save image",
          description: error.message,
          variant: "destructive",
        });
      } catch (toastErr) {
        console.error("Error showing error toast:", toastErr);
      }
    },
    retry: false,
  });
  
  const handleGenerateImage = () => {
    if (!imagePrompt.trim()) {
      toast({
        title: "Empty prompt",
        description: "Please enter a prompt to generate an image.",
        variant: "destructive",
      });
      return;
    }
    
    // We're exclusively using gpt-image-1 which doesn't support reference_images
    // For variations, we rely on the prompt to describe what we want
    generateImageMutation.mutate({
      prompt: imagePrompt,
      model: "gpt-image-1",
      size,
      quality,
      background: background
    });
  };
  
  const handleSaveImage = () => {
    if (!generatedImageUrl) {
      toast({
        title: "No image to save",
        description: "Please generate an image first.",
        variant: "destructive",
      });
      return;
    }
    
    if (!imageTitle.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your image.",
        variant: "destructive",
      });
      return;
    }
    
    saveImageMutation.mutate();
  };
  
  // Handle prompt from the agent
  const handlePromptFromAgent = (prompt: string) => {
    setImagePrompt(prompt);
    toast({
      title: "Prompt Applied",
      description: "The AI-generated prompt has been applied. You can now generate your image.",
    });
  };
  
  // Handle image editing
  const handleEditImage = (imageUrl: string, imageId?: number) => {
    setEditingImageUrl(imageUrl);
    setEditingImageId(imageId);
    setIsImageEditorOpen(true);
  };

  // Handle when image editing is complete
  const handleImageEdited = (newImageUrl: string) => {
    setGeneratedImageUrl(newImageUrl);
    toast({
      title: "Image edited successfully",
      description: "Your edited image is now ready to save or download.",
    });
  };

  // Handle edit image trigger from variation prompt
  useEffect(() => {
    if (variationPrompt && variationPrompt.startsWith('EDIT_IMAGE:')) {
      console.log("Handling edit image request");
      
      // Find the last colon to separate the ID from the URL
      const lastColonIndex = variationPrompt.lastIndexOf(':');
      
      if (lastColonIndex > 10) { // Make sure it's not the colon from "EDIT_IMAGE:"
        // Extract everything between "EDIT_IMAGE:" and the last colon as the image URL
        const imageUrl = variationPrompt.substring(11, lastColonIndex); // 11 = "EDIT_IMAGE:".length
        const imageIdStr = variationPrompt.substring(lastColonIndex + 1);
        const imageId = parseInt(imageIdStr);
        
        console.log("Opening image editor for image ID:", imageId);
        
        handleEditImage(imageUrl, imageId);
        
        // Clear the variation prompt immediately to prevent it from affecting the prompt field
        if (setVariationPrompt) {
          setVariationPrompt(null);
        }
      } else {
        console.error("Could not parse edit image request");
        // Clear invalid variation prompt
        if (setVariationPrompt) {
          setVariationPrompt(null);
        }
      }
      return; // Exit early to prevent the general variation handler from running
    }
  }, [variationPrompt, setVariationPrompt]);

  // Handle creating variations of an image
  const handleCreateVariations = async (imageUrl: string) => {
    if (!imageUrl) {
      console.error("Cannot create variations: No image URL provided");
      toast({
        title: "Error preparing variations",
        description: "No image was found to create variations from.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      console.log("Creating variations for image:", imageUrl.substring(0, 50) + "...");
      
      // Since gpt-image-1 doesn't support reference images, we'll enhance the prompt instead
      // Update the prompt to request variations with detailed instructions
      let variationPrompt = "Create a variation of this image while maintaining the same style, theme, and composition.";
      
      // If we have an original prompt, include it to help guide the variation
      if (imagePrompt && imagePrompt.trim().length > 0) {
        variationPrompt += ` The original image description was: "${imagePrompt}". 
        Keep the core elements but vary the details, positioning, colors, or perspective.`;
      } else {
        variationPrompt += ` Vary the details, positioning, colors, or perspective while maintaining the core concept.`;
      }
      
      // Set the variation prompt
      setImagePrompt(variationPrompt);
      
      toast({
        title: "Ready for Variations",
        description: "Click 'Generate Image' to create variations based on your previous image.",
      });
    } catch (error) {
      console.error("Error preparing variations:", error);
      toast({
        title: "Error preparing variations",
        description: "There was an error setting up the variation prompt.",
        variant: "destructive",
      });
    }
  };

  // Basic variation prompt handler with error handling (exclude edit image prompts)
  useEffect(() => {
    try {
      if (variationPrompt && !variationPrompt.startsWith('EDIT_IMAGE:')) {
        console.log("Applying variation prompt:", variationPrompt.substring(0, 50) + "...");
        
        // Set the image prompt to the variation prompt and exit
        setImagePrompt(variationPrompt);
        
        // Clear the variation prompt to prevent reapplying it
        if (setVariationPrompt) {
          setVariationPrompt(null);
        }
        
        try {
          toast({
            title: "Ready for Variations",
            description: "Click 'Generate Image' to create variations based on your selected image.",
          });
        } catch (toastErr) {
          console.error("Error showing toast in useEffect:", toastErr);
        }
      }
    } catch (err) {
      console.error("Error in variation prompt handler useEffect:", err);
      // Don't rethrow - silent recovery is better than crashing
    }
  }, [variationPrompt, setVariationPrompt, toast]);
  
  // Previously declared above, no need for duplicate declarations or effects

  return (
    <ErrorBoundary 
      FallbackComponent={ErrorFallback} 
      onReset={() => {
        console.log("Visual tab error boundary reset");
        setGeneratedImageUrl(null);
        setImagePrompt("");
        setImageTitle("");
      }}
    >
      <TabContent 
        model={model}
        setModel={setModel}
        onOpenImageLibrary={onOpenImageLibrary}
        imagePrompt={imagePrompt}
        setImagePrompt={setImagePrompt}
        generatedImageUrl={generatedImageUrl}
        setGeneratedImageUrl={setGeneratedImageUrl}
        size={size}
        setSize={setSize}
        quality={quality}
        setQuality={setQuality}
        background={background}
        setBackground={setBackground}
        imageTitle={imageTitle}
        setImageTitle={setImageTitle}
        isProcessingDialogOpen={isProcessingDialogOpen}
        setIsProcessingDialogOpen={setIsProcessingDialogOpen}
        generateImageMutation={generateImageMutation}
        saveImageMutation={saveImageMutation}
        handleGenerateImage={handleGenerateImage}
        handleSaveImage={handleSaveImage}
        handlePromptFromAgent={handlePromptFromAgent}
        handleCreateVariations={handleCreateVariations}
        clearVisualTab={clearVisualTab}
      />
      
      {/* Image Editor Dialog */}
      <ImageEditor
        open={isImageEditorOpen}
        onOpenChange={setIsImageEditorOpen}
        imageUrl={editingImageUrl}
        imageId={editingImageId}
        onImageEdited={handleImageEdited}
      />
    </ErrorBoundary>
  );
}