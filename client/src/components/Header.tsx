import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { User, Menu } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import nabliLogo from "@assets/nabli_logo_transparent - Edited.png";

export default function Header() {
  const [location] = useLocation();
  const { user, isAuthenticated } = useAuth();
  
  return (
    <header className="bg-white shadow-md">
      <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            <img 
              src={nabliLogo} 
              alt="nabli logo" 
              className="h-28 w-auto mr-2"
            />
          </Link>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Main Navigation Hamburger Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link href="/" className={location === '/' ? 'text-primary font-medium' : ''}>
                  Create
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/library" className={location === '/library' ? 'text-primary font-medium' : ''}>
                  My Library
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/characters" className={location === '/characters' ? 'text-primary font-medium' : ''}>
                  Characters
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/sound-effects" className={location === '/sound-effects' ? 'text-primary font-medium' : ''}>
                  Sound Effects
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/export" className={location === '/export' ? 'text-primary font-medium' : ''}>
                  Export
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/subscription" className={location === '/subscription' ? 'text-primary font-medium' : ''}>
                  Plans
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/help" className={location === '/help' ? 'text-primary font-medium' : ''}>
                  Help
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Account Section */}
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <User size={18} />
                  <span className="hidden sm:inline">{user?.username || 'User'}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/library">My Stories</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="/api/logout">Sign Out</a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild className="bg-accent hover:bg-amber-400 text-dark font-semibold">
              <a href="/api/login">Sign In</a>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
