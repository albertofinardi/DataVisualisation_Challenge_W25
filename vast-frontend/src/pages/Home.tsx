import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Clock, Database, Users } from 'lucide-react';

export function Home() {
  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">VAST Challenge Data Visualization</h1>
        <p className="text-muted-foreground text-lg">
          Exploring participant location data through interactive visualizations
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              About the Dataset
            </CardTitle>
            <CardDescription>Comprehensive location tracking data</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This project visualizes location data from the VAST Challenge, containing participant
              check-ins across various locations. The dataset includes temporal information,
              allowing for time-based analysis of movement patterns.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Authors
            </CardTitle>
            <CardDescription>Project contributors</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>Alberto Finardi</li>
              <li>Tommaso Crippa</li>
              <li>Tom Gave</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground">
          Navigate to the other pages to explore the interactive visualizations
        </p>
      </div>
    </div>
  );
}
