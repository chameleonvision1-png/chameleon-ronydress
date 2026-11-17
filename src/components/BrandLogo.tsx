import { cn } from "@/lib/utils";

interface BrandLogoProps {
  variant?: "full" | "monogram" | "wordmark" | "mark";
  tone?: "auto" | "gold" | "light" | "dark";
  className?: string;
  alt?: string;
}

export function BrandLogo({
  variant = "full",
  tone = "auto",
  className,
  alt = "Rony Dress — أتيليه فستان ست البنات",
}: BrandLogoProps) {
  const base =
    variant === "monogram"
      ? "/logo-monogram"
      : variant === "wordmark"
        ? "/logo-wordmark"
        : variant === "mark"
          ? "/logo-mark"
          : "/logo-full";

  if (tone === "gold") {
    return (
      <img
        src={`${base}.webp`}
        alt={alt}
        className={cn("h-10 w-auto object-contain select-none", className)}
      />
    );
  }
  if (tone === "light") {
    return (
      <img
        src={`${base}-light.webp`}
        alt={alt}
        className={cn("h-10 w-auto object-contain select-none", className)}
      />
    );
  }
  if (tone === "dark") {
    return (
      <img
        src={`${base}-dark.webp`}
        alt={alt}
        className={cn("h-10 w-auto object-contain select-none", className)}
      />
    );
  }

  return (
    <span className="inline-flex items-center select-none">
      <img
        src={`${base}.webp`}
        alt={alt}
        className={cn("show-in-light h-10 w-auto object-contain", className)}
      />
      <img
        src={`${base}-light.webp`}
        alt={alt}
        className={cn("show-in-dark h-10 w-auto object-contain", className)}
      />
    </span>
  );
}
