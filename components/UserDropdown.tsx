"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut, Loader2 } from "lucide-react";
import NavItems from "@/components/NavItems";
import { signOut } from "@/lib/actions/auth.actions";
import type { StockWithWatchlistStatus } from "@/lib/types";
import { useState } from "react";

interface UserDropdownProps {
  user: User;
  initialStocks: StockWithWatchlistStatus[];
}

const UserDropdown = ({ user, initialStocks }: UserDropdownProps) => {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSignOut = async (e: any) => {
    e.preventDefault();
    setIsLoggingOut(true);
    await signOut();
    router.push("/sign-in");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-3 text-gray-4 hover:text-yellow-500"
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-yellow-500 text-yellow-900 text-sm font-bold">
              {user.name[0]}
            </AvatarFallback>
          </Avatar>

          <div className="hidden md:flex flex-col items-start">
            <span className="text-base font-medium text-gray-400">
              {user.name}
            </span>
          </div>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="text-gray-400">
        <DropdownMenuLabel>
          <div className="flex relative items-center gap-3 py-2">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-yellow-500 text-yellow-900 text-sm font-bold">
                {user.name[0]}
              </AvatarFallback>
            </Avatar>

            <div className="flex flex-col">
              <span className="text-base font-medium text-gray-400">
                {user.name}
              </span>
              <span className="text-sm text-gray-500">{user.email}</span>
            </div>
          </div>
        </DropdownMenuLabel>

        {user.investmentGoals && (
          <>
            <DropdownMenuSeparator className="bg-gray-600" />
            <div className="px-2 py-2 text-sm text-gray-400 space-y-2">
              <div className="flex flex-col">
                <span className="text-gray-500 text-xs uppercase font-semibold">
                  Investment Goals
                </span>
                <span className="text-gray-200">{user.investmentGoals}</span>
              </div>

              {user.riskTolerance && (
                <div className="flex flex-col">
                  <span className="text-gray-500 text-xs uppercase font-semibold">
                    Risk Tolerance
                  </span>
                  <span className="text-gray-200">{user.riskTolerance}</span>
                </div>
              )}

              {user.preferredIndustry && (
                <div className="flex flex-col">
                  <span className="text-gray-500 text-xs uppercase font-semibold">
                    Preferred Industry
                  </span>
                  <span className="text-gray-200">{user.preferredIndustry}</span>
                </div>
              )}
            </div>
          </>
        )}

        <DropdownMenuSeparator className="bg-gray-600" />

        <DropdownMenuItem
          onSelect={handleSignOut}
          className="text-gray-100 text-md font-medium focus:bg-transparent focus:text-yellow-500 transition-colors cursor-pointer"
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <LogOut className="h-4 w-4 mr-2 hidden sm:block" />
          )}
          {isLoggingOut ? "Logging out..." : "Logout"}
        </DropdownMenuItem>

        <DropdownMenuSeparator className="hidden sm:block bg-gray-600" />

        {/* Mobile nav only */}
        <nav className="sm:hidden">
          <NavItems initialStocks={initialStocks} />
        </nav>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserDropdown;
