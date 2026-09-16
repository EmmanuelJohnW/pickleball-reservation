import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function LoadingSpinner({ className }) {
  return (
    <div className={cn("flex items-center justify-center py-12", className)}>
      <Loader2 className="h-8 w-8 animate-spin text-green-600" />
    </div>
  );
}

export function LoadingPage() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <Loader2 className="h-10 w-10 animate-spin text-green-600 mx-auto mb-4" />
        <p className="text-gray-500 text-sm">Loading...</p>
      </div>
    </div>
  );
}
