import { Search, Bell, LogOut, Ticket } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const Header = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-background via-background/80 to-transparent">
      <div className="container flex items-center justify-between py-4">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
            <span className="text-primary-foreground font-display text-lg leading-none">T</span>
          </div>
          <span className="font-display text-xl md:text-2xl text-foreground tracking-wider">
            Telugu<span className="text-primary">Shows</span>
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          {["Home", "Movies", "Theatres", "Coming Soon"].map((item) => (
            <a key={item} href="#" className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors">
              {item}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button className="text-muted-foreground hover:text-foreground transition-colors">
            <Search size={20} />
          </button>
          {user ? (
            <>
              <button
                onClick={() => navigate("/my-bookings")}
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="My Bookings"
              >
                <Ticket size={20} />
              </button>
              <span className="text-muted-foreground text-sm hidden md:block truncate max-w-[120px]">
                {user.email}
              </span>
              <button
                onClick={signOut}
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="Sign Out"
              >
                <LogOut size={20} />
              </button>
            </>
          ) : (
            <button
              onClick={() => navigate("/auth")}
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
