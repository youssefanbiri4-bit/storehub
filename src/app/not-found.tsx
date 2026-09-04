import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-20 text-center">
      <div className="max-w-md mx-auto">
        <span className="inline-block text-[8rem] font-bold text-foreground/10 leading-none mb-4 font-heading">
          404
        </span>
        <h1 className="text-2xl font-bold mb-3 tracking-tight font-heading">Page not found</h1>
        <p className="text-muted-foreground mb-8">
          Sorry, the page you are looking for does not exist or has been moved.
        </p>
        <Button size="lg" className="gap-2" render={<Link href="/" />}>
          Back to Home
        </Button>
      </div>
    </div>
  );
}
