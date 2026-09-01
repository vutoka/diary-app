"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const linkClass = (href: string) =>
    `text-sm font-medium ${
      pathname.startsWith(href)
        ? "text-gray-900"
        : "text-gray-500 hover:text-gray-900"
    }`;

  return (
    <nav className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
      <div className="flex items-center gap-6">
        <Link href="/diary" className={linkClass("/diary")}>
          Diary
        </Link>
        <Link href="/dictionary" className={linkClass("/dictionary")}>
          Dictionary
        </Link>
      </div>
      <button
        onClick={handleLogout}
        className="text-sm font-medium text-gray-500 hover:text-gray-900"
      >
        Log out
      </button>
    </nav>
  );
}
