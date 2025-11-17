import { useEffect, useState } from 'react';
import { Monitor } from 'lucide-react';

const DESKTOP_MIN_WIDTH = 1024;

export function DesktopOnly({ children }: { children: React.ReactNode }) {
  const [isDesktop, setIsDesktop] = useState<boolean>(true);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= DESKTOP_MIN_WIDTH);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  if (!isDesktop) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-6">
        <div className="max-w-md text-center space-y-6">
          <div className="flex justify-center">
            <Monitor className="h-16 w-16 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Desktop Required</h1>
            <p className="text-muted-foreground">
              This visualization application is designed for desktop screens only.
            </p>
            <p className="text-sm text-muted-foreground">
              Please access this application from a device with a screen width of at least 1024px.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
