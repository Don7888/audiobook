import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";
import { useMobile } from "@/hooks/use-mobile";
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
                  <Link href="/help">Help</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <ul className="flex space-x-6 items-center">
              <li>
                <Link href="/">
                  <a className={`font-medium hover:text-primary transition-colors duration-200 ${location === '/' ? 'text-primary' : ''}`}>
                    Create
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/library">
                  <a className={`font-medium hover:text-primary transition-colors duration-200 ${location === '/library' ? 'text-primary' : ''}`}>
                    My Library
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/help">
                  <a className={`font-medium hover:text-primary transition-colors duration-200 ${location === '/help' ? 'text-primary' : ''}`}>
                    Help
                  </a>
                </Link>
              </li>
              <li>
                <Button className="bg-accent hover:bg-amber-400 text-dark font-semibold">
                  Sign In
                </Button>
              </li>
            </ul>
          )}
          
          {isMobile && (
            <Button className="bg-accent hover:bg-amber-400 text-dark font-semibold ml-2">
              Sign In
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
