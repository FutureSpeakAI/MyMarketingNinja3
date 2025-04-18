import { Button } from "@/components/ui/button";
import { Library, Database } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface HeaderProps {
  onOpenSavedContentLibrary?: () => void;
  onOpenDataMigration?: () => void;
  // Keeping this to avoid breaking existing code, but we won't use it anymore
  onOpenApiKeyModal?: () => void;
}

export function Header({ onOpenSavedContentLibrary, onOpenDataMigration, onOpenApiKeyModal }: HeaderProps) {
  const isMobile = useIsMobile();
  return (
    <header className="bg-black py-3 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo and title */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg width="40" height="40" viewBox="0 0 40 40" className="text-[#F15A22]">
                {/* Aquent's distinctive "A" logo */}
                <path 
                  fill="currentColor" 
                  d="M23.5,8 L32,32 H27 L25,27 H15 L13,32 H8 L16.5,8 H23.5 Z M20,12 L16,22 H24 L20,12 Z"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h1 className="text-xl font-bold text-white">
                <span className="text-[#F15A22]">Aquent</span> Content AI
              </h1>
              <p className="text-gray-300 text-xs">Smart content creation powered by AI</p>
            </div>
          </div>
          
          {/* Right side buttons */}
          <div className="flex space-x-2 md:space-x-3">
            {/* Saved Content Library button */}
            {onOpenSavedContentLibrary && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onOpenSavedContentLibrary}
                className="bg-white text-[#F15A22] hover:bg-[#F15A22] hover:text-white border-[#F15A22]"
              >
                <Library className="h-4 w-4 mr-1 flex-shrink-0" />
                {!isMobile && <span>Content Library</span>}
                {isMobile && <span className="sr-only">Content Library</span>}
              </Button>
            )}
            
            {/* Data Migration button */}
            {onOpenDataMigration && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onOpenDataMigration}
                className="bg-white text-[#F15A22] hover:bg-[#F15A22] hover:text-white border-[#F15A22]"
              >
                <Database className="h-4 w-4 mr-1 flex-shrink-0" />
                {!isMobile && <span>Data Migration</span>}
                {isMobile && <span className="sr-only">Data Migration</span>}
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}