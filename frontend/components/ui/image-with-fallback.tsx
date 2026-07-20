"use client";

import React, { useState } from "react";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils";

type ImageWithFallbackProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  fallbackIcon?: React.ComponentType<{ className?: string }>;
  containerClassName?: string;
};

export function ImageWithFallback({
  src,
  alt,
  className,
  containerClassName,
  fallbackIcon: FallbackIcon = Package,
  ...props
}: ImageWithFallbackProps) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div
        className={cn(
          "flex h-full w-full items-center justify-center bg-muted/60 text-muted-foreground border border-border/60 rounded-md select-none",
          containerClassName,
          className
        )}
      >
        <div className="flex flex-col items-center gap-1 p-2 text-center">
          <FallbackIcon className="h-6 w-6 text-muted-foreground/70" />
          {alt && <span className="text-[10px] font-medium text-muted-foreground/80 line-clamp-1">{alt}</span>}
        </div>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt || "Asset Image"}
      className={className}
      onError={() => setError(true)}
      {...props}
    />
  );
}

export default ImageWithFallback;
