import { Link, useLocation } from "wouter";
import { ShieldCheck, CloudRain, Sprout } from "lucide-react";
import { cn } from "@/lib/utils";

const sections = [
  {
    name: "Women Safety",
    path: "/women-safety",
    icon: ShieldCheck,
  },
  {
    name: "Disaster Management",
    path: "/disaster",
    icon: CloudRain,
  },
  {
    name: "Farmers Support",
    path: "/farmers",
    icon: Sprout,
  },
];

export function Navigation() {
  const [location] = useLocation();

  return (
    <nav className="border-b bg-card/50 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center gap-1 md:gap-2">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = location === section.path || (section.path === '/farmers' && location.startsWith('/crop-info'));
            
            return (
              <Link key={section.path} href={section.path}>
                <button
                  className={cn(
                    "flex items-center gap-2 px-4 md:px-6 py-4 text-sm md:text-base font-semibold transition-colors relative hover-elevate",
                    isActive 
                      ? "text-primary" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  data-testid={`nav-${section.path.slice(1)}`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="hidden sm:inline">{section.name}</span>
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-md" />
                  )}
                </button>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
