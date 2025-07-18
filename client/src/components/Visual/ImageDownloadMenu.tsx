import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Download, ChevronDown } from "lucide-react";

interface ImageDownloadMenuProps {
  imageUrl: string;
  filename: string;
  className?: string;
}

export const ImageDownloadMenu: React.FC<ImageDownloadMenuProps> = ({
  imageUrl,
  filename,
  className = ""
}) => {
  const [selectedFormat, setSelectedFormat] = useState("png");
  const [resolutionMultiplier, setResolutionMultiplier] = useState("1");

  const downloadImage = async (format: string, multiplier: string) => {
    try {
      // SVG format requires special handling since it's vector-based
      if (format === "svg") {
        // For SVG, we create an embedded raster image within an SVG container
        const img = new Image();
        img.crossOrigin = "anonymous";
        
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = imageUrl;
        });

        const scale = parseFloat(multiplier);
        const width = img.width * scale;
        const height = img.height * scale;

        // Create SVG with embedded base64 image
        const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
     width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <image x="0" y="0" width="${width}" height="${height}" xlink:href="${imageUrl}"/>
</svg>`;

        const blob = new Blob([svgContent], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${filename}-${scale}x.svg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        return;
      }

      // Handle raster formats (PNG, JPG, WebP)
      const img = new Image();
      img.crossOrigin = "anonymous";
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
      });

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Apply resolution multiplier
      const scale = parseFloat(multiplier);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      // Enable high-quality scaling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Draw the scaled image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Convert to desired format
      let mimeType = "image/png";
      let quality = 1.0;
      
      switch (format) {
        case "jpg":
        case "jpeg":
          mimeType = "image/jpeg";
          quality = 0.95;
          break;
        case "webp":
          mimeType = "image/webp";
          quality = 0.95;
          break;
        case "png":
        default:
          mimeType = "image/png";
          break;
      }

      // Create download link
      canvas.toBlob((blob) => {
        if (!blob) return;
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${filename}-${scale}x.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, mimeType, quality);

    } catch (error) {
      console.error("Download failed:", error);
      // Fallback: direct download
      const link = document.createElement("a");
      link.href = imageUrl;
      link.download = `${filename}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleQuickDownload = () => {
    downloadImage(selectedFormat, resolutionMultiplier);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <Download className="mr-2 h-4 w-4" />
          Download
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="start">
        <DropdownMenuLabel>Download Options</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <div className="p-3 space-y-4">
          {/* Format Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Format</Label>
            <Select value={selectedFormat} onValueChange={setSelectedFormat}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="png">PNG (Lossless, Transparency)</SelectItem>
                <SelectItem value="jpg">JPG (Smaller Size)</SelectItem>
                <SelectItem value="webp">WebP (Modern, Efficient)</SelectItem>
                <SelectItem value="svg">SVG (Scalable Vector)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Resolution Multiplier */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Resolution</Label>
            <Select value={resolutionMultiplier} onValueChange={setResolutionMultiplier}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0.5">0.5× (512px - Web)</SelectItem>
                <SelectItem value="1">1× (1024px - Standard)</SelectItem>
                <SelectItem value="1.5">1.5× (1536px - Enhanced)</SelectItem>
                <SelectItem value="2">2× (2048px - High Quality)</SelectItem>
                <SelectItem value="3">3× (3072px - Print Quality)</SelectItem>
                <SelectItem value="4">4× (4096px - Ultra HD)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quick Download Button */}
          <Button 
            onClick={handleQuickDownload}
            className="w-full"
            size="sm"
          >
            <Download className="mr-2 h-4 w-4" />
            Download {selectedFormat.toUpperCase()} ({resolutionMultiplier}×)
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};