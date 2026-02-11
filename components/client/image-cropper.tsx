"use client";

import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { getCroppedImg } from "@/lib/canvasUtils";
import { Loader2, ZoomIn, ZoomOut, RotateCw } from "lucide-react";

interface ImageCropperProps {
  imageSrc: string | null;
  open: boolean;
  onClose: () => void;
  onCropComplete: (croppedImage: Blob) => Promise<void> | void;
  aspect?: number;
}

export function ImageCropper({
  imageSrc,
  open,
  onClose,
  onCropComplete,
  aspect = 16 / 9,
}: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const onCropChange = (crop: { x: number; y: number }) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom: number) => {
    setZoom(zoom);
  };

  const onCropCompleteHandler = useCallback(
    (croppedArea: any, croppedAreaPixels: any) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    [],
  );

  const handleSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    setIsLoading(true);
    try {
      const croppedImage = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        rotation,
      );
      await onCropComplete(croppedImage);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Editar Imagem</DialogTitle>
        </DialogHeader>

        <div className="relative h-[400px] w-full bg-white mt-4">
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={aspect}
              onCropChange={onCropChange}
              onCropComplete={onCropCompleteHandler}
              onZoomChange={onZoomChange}
              restrictPosition={false}
            />
          )}
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center gap-4">
            <ZoomOut className="h-4 w-4 text-muted-foreground" />
            <Slider
              value={[zoom]}
              min={0.5}
              max={3}
              step={0.1}
              onValueChange={(value) => setZoom(value[0])}
              className="flex-1"
            />
            <ZoomIn className="h-4 w-4 text-muted-foreground" />
          </div>

          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setRotation((r) => r + 90)}
              title="Rotacionar"
            >
              <RotateCw className="h-4 w-4" />
            </Button>

            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
