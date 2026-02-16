import { Home, Film, Ticket, User } from "lucide-react";

const navItems = [
  { icon: Home, label: "Home" },
  { icon: Film, label: "Movies" },
  { icon: Ticket, label: "Bookings" },
  { icon: User, label: "Profile" },
];

const MobileNav = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card/95 backdrop-blur-lg border-t border-border">
      <div className="flex items-center justify-around py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {navItems.map(({ icon: Icon, label }, i) => (
          <button
            key={label}
            className={`flex flex-col items-center gap-0.5 px-4 py-1 transition-colors ${
              i === 0 ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon size={20} />
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default MobileNav;
