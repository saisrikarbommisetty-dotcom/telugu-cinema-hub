import { Search, Bell } from "lucide-react";

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-background via-background/80 to-transparent">
      <div className="container flex items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
            <span className="text-primary-foreground font-display text-lg leading-none">T</span>
          </div>
          <span className="font-display text-xl md:text-2xl text-foreground tracking-wider">
            Telugu<span className="text-primary">Shows</span>
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          {["Home", "Movies", "Theatres", "Coming Soon"].map((item) => (
            <a
              key={item}
              href="#"
              className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
            >
              {item}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button className="text-muted-foreground hover:text-foreground transition-colors">
            <Search size={20} />
          </button>
          <button className="text-muted-foreground hover:text-foreground transition-colors hidden md:block">
            <Bell size={20} />
          </button>
          <button className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold px-4 py-2 rounded-lg transition-colors hidden md:block">
            Sign In
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
