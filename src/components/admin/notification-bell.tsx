"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function NotificationBell({ count = 0 }: { count?: number }) {
  return (
    <Link href="/admin/notifications">
      <Button variant="ghost" size="icon" className="relative h-9 w-9">
        <Bell className="h-4 w-4" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center h-4.5 min-w-4.5 px-1 rounded-full bg-danger text-white text-[10px] font-bold leading-none">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </Button>
    </Link>
  );
}
