import { Link, useLocation } from 'react-router-dom';
import { Home, MapPin, Activity, Calendar, Users } from 'lucide-react';

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex flex-col h-screen">
      <header className="border-b bg-background">
        <div className="flex items-center h-14 px-4">
          <h1 className="text-lg font-semibold mr-6">VAST Challenge</h1>
          <nav className="flex gap-1">
            <Link
              to="/"
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive('/')
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
              }`}
            >
              <Home className="h-4 w-4" />
              Home
            </Link>
            <Link
              to="/heatmap"
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive('/heatmap')
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
              }`}
            >
              <MapPin className="h-4 w-4" />
              Heatmap
            </Link>
            <Link
              to="/streamgraph"
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive('/streamgraph')
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
              }`}
            >
              <Activity className="h-4 w-4" />
              Streamgraph
            </Link>
            <Link
              to="/activity-calendar"
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive('/activity-calendar')
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
              }`}
            >
              <Calendar className="h-4 w-4" />
              Activity Calendar
            </Link>
            <Link
              to="/participant-comparison"
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive('/participant-comparison')
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
              }`}
            >
              <Users className="h-4 w-4" />
              Compare
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
