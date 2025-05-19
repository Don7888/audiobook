import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { BookOpen, User } from "lucide-react";
import { useMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Menu } from "lucide-react";

export default function Header() {
  const isMobile = useMobile();
  const [location] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  
  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <div className="text-primary text-3xl mr-2">
            <BookOpen />
          </div>
          <Link href="/">
            <h1 className="font-heading font-bold text-2xl md:text-3xl text-primary cursor-pointer">
              StoryTunes
            </h1>
          </Link>
        </div>
        <nav>
          {isMobile ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/">Create</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/library">My Library</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/characters">Characters</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/sound-effects">Sound Effects</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/export">Export</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/subscription">Plans</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/help">Help</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <ul className="flex space-x-6 items-center">
              <li>
                <Link href="/">
                  <span className={`font-medium hover:text-primary transition-colors duration-200 ${location === '/' ? 'text-primary' : ''}`}>
                    Create
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/library">
                  <span className={`font-medium hover:text-primary transition-colors duration-200 ${location === '/library' ? 'text-primary' : ''}`}>
                    My Library
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/subscription">
                  <span className={`font-medium hover:text-primary transition-colors duration-200 ${location === '/subscription' ? 'text-primary' : ''}`}>
                    Plans
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/characters">
                  <span className={`font-medium hover:text-primary transition-colors duration-200 ${location === '/characters' ? 'text-primary' : ''}`}>
                    Characters
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/sound-effects">
                  <span className={`font-medium hover:text-primary transition-colors duration-200 ${location === '/sound-effects' ? 'text-primary' : ''}`}>
                    Sound Effects
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/export">
                  <span className={`font-medium hover:text-primary transition-colors duration-200 ${location === '/export' ? 'text-primary' : ''}`}>
                    Export
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/help">
                  <span className={`font-medium hover:text-primary transition-colors duration-200 ${location === '/help' ? 'text-primary' : ''}`}>
                    Help
                  </span>
                </Link>
              </li>
              <li>
                {isAuthenticated ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="flex items-center gap-2">
                        <User size={18} />
                        <span>{user?.username}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href="/library">My Stories</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => logout()}>
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Link href="/signin">
                    <Button className="bg-accent hover:bg-amber-400 text-dark font-semibold">
                      Sign In
                    </Button>
                  </Link>
                )}
              </li>
            </ul>
          )}
          
          {isMobile && !isAuthenticated && (
            <Link href="/signin">
              <Button className="bg-accent hover:bg-amber-400 text-dark font-semibold ml-2">
                Sign In
              </Button>
            </Link>
          )}
          {isMobile && isAuthenticated && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2 ml-2">
                  <User size={18} />
                  <span>{user?.username}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/library">My Stories</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => logout()}>
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </nav>
      </div>
    </header>
  );
}
