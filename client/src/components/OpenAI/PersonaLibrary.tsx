import React, { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { SavedPersona, CreatePersonaRequest, UpdatePersonaRequest } from "@/lib/types";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { User, MoreVertical, Pencil, Trash2, PlusCircle, UserCircle2 } from "lucide-react";

interface PersonaLibraryProps {
  onSelectPersona: (persona: SavedPersona) => void;
}

export function PersonaLibrary({ onSelectPersona }: PersonaLibraryProps) {
  const [isPersonaFormOpen, setIsPersonaFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<SavedPersona | null>(null);
  const [formData, setFormData] = useState<CreatePersonaRequest>({
    name: "",
    description: "",
    instruction: ""
  });

  const { toast } = useToast();

  // Fetch saved personas
  const { data: personas = [], refetch } = useQuery({
    queryKey: ['/api/personas'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/personas');
      return response.json() as Promise<SavedPersona[]>;
    }
  });

  // Create a new persona
  const createPersonaMutation = useMutation({
    mutationFn: async (data: CreatePersonaRequest) => {
      const response = await apiRequest('POST', '/api/personas', data);
      return response.json() as Promise<SavedPersona>;
    },
    onSuccess: () => {
      toast({
        title: "Persona saved",
        description: "Your persona has been saved to the library.",
      });
      setIsPersonaFormOpen(false);
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save persona",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Update an existing persona
  const updatePersonaMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdatePersonaRequest }) => {
      const response = await apiRequest('PUT', `/api/personas/${id}`, data);
      return response.json() as Promise<SavedPersona>;
    },
    onSuccess: () => {
      toast({
        title: "Persona updated",
        description: "Your persona has been updated successfully.",
      });
      setIsPersonaFormOpen(false);
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update persona",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Delete a persona
  const deletePersonaMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/personas/${id}`);
      return id;
    },
    onSuccess: () => {
      toast({
        title: "Persona deleted",
        description: "The persona has been removed from your library.",
      });
      setIsDeleteDialogOpen(false);
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete persona",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Handle opening the form to create a new persona
  const handleCreateNew = () => {
    setFormData({
      name: "",
      description: "",
      instruction: ""
    });
    setSelectedPersona(null);
    setIsPersonaFormOpen(true);
  };

  // Handle opening the form to edit an existing persona
  const handleEditPersona = (persona: SavedPersona) => {
    setSelectedPersona(persona);
    setFormData({
      name: persona.name,
      description: persona.description,
      instruction: persona.instruction
    });
    setIsPersonaFormOpen(true);
  };

  // Handle saving a persona (create or update)
  const handleSavePersona = () => {
    if (selectedPersona) {
      // Update existing persona
      updatePersonaMutation.mutate({
        id: selectedPersona.id,
        data: formData
      });
    } else {
      // Create new persona
      createPersonaMutation.mutate(formData);
    }
  };

  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    if (selectedPersona) {
      deletePersonaMutation.mutate(selectedPersona.id);
    }
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Persona Library</h2>
        <Button onClick={handleCreateNew} className="flex items-center gap-2">
          <PlusCircle className="h-4 w-4" />
          <span>New Persona</span>
        </Button>
      </div>

      {personas.length === 0 ? (
        <div className="border rounded-lg p-8 text-center bg-muted/50">
          <UserCircle2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No saved personas</h3>
          <p className="text-muted-foreground mb-4">
            Create personas to quickly transform your text with distinct writing styles.
          </p>
          <Button onClick={handleCreateNew} variant="outline">
            Create Your First Persona
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {personas.map((persona) => (
            <Card key={persona.id} className="flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl truncate" title={persona.name}>
                    {persona.name}
                  </CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditPersona(persona)} className="flex items-center gap-2">
                        <Pencil className="h-4 w-4" />
                        <span>Edit</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => {
                          setSelectedPersona(persona);
                          setIsDeleteDialogOpen(true);
                        }}
                        className="text-destructive flex items-center gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Delete</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardDescription>{formatDate(persona.updatedAt)}</CardDescription>
              </CardHeader>
              <CardContent className="py-2 flex-grow">
                <div className="flex flex-col h-full">
                  {persona.description && (
                    <div className="mb-2">
                      <span className="text-xs font-medium text-muted-foreground">Description:</span>
                      <p className="text-sm line-clamp-3">{persona.description}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">Instruction:</span>
                    <p className="text-sm line-clamp-3">{persona.instruction}</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-2">
                <Button 
                  onClick={() => onSelectPersona(persona)} 
                  variant="secondary" 
                  className="w-full flex items-center gap-2"
                >
                  <User className="h-4 w-4" />
                  <span>Use This Persona</span>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Form Dialog for Creating/Editing Personas */}
      <Dialog 
        open={isPersonaFormOpen} 
        onOpenChange={(open) => {
          setIsPersonaFormOpen(open);
          if (!open) {
            setFormData({
              name: "",
              description: "",
              instruction: ""
            });
          }
        }}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{selectedPersona ? 'Edit Persona' : 'Create New Persona'}</DialogTitle>
            <DialogDescription>
              {selectedPersona 
                ? 'Make changes to your saved persona.' 
                : 'Create a new persona to save to your library.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input 
                id="name" 
                name="name" 
                value={formData.name} 
                onChange={handleInputChange}
                placeholder="e.g., Shakespearean, Business Professional, etc." 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea 
                id="description" 
                name="description" 
                value={formData.description} 
                onChange={handleInputChange}
                placeholder="Brief description of this persona style"
                className="min-h-[80px]"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="instruction">Instruction</Label>
              <Textarea 
                id="instruction" 
                name="instruction" 
                value={formData.instruction} 
                onChange={handleInputChange}
                placeholder="e.g., Rewrite the text in the style of Shakespeare using Early Modern English vocabulary, iambic pentameter, and frequent metaphors."
                className="min-h-[120px]"
              />
              <p className="text-sm text-muted-foreground">
                Provide clear instructions for how the AI should transform the text using this persona.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsPersonaFormOpen(false)}
              disabled={createPersonaMutation.isPending || updatePersonaMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSavePersona}
              disabled={
                !formData.name || 
                !formData.instruction ||
                createPersonaMutation.isPending || 
                updatePersonaMutation.isPending
              }
            >
              {createPersonaMutation.isPending || updatePersonaMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                  Saving...
                </span>
              ) : (
                selectedPersona ? 'Update Persona' : 'Save Persona'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this persona from your library.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deletePersonaMutation.isPending}
            >
              {deletePersonaMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}