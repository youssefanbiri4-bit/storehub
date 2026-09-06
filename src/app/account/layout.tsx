import type { Metadata } from "next";
import { AccountSidebar } from "@/components/account/account-sidebar";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: {
    default: "My Account",
    template: "%s | My Account",
  },
};

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container mx-auto px-4 py-6 md:py-8 max-w-6xl overflow-hidden">
      <div className="grid gap-6 lg:gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-20 lg:self-start min-w-0">
          <AccountSidebar />
        </aside>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
