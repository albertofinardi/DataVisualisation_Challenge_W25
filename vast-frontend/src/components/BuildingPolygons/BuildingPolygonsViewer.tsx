import { useState, useEffect } from 'react';
import { BuildingPolygons } from './BuildingPolygons';
import { LoadingSpinner } from '../LoadingSpinner';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { BuildingPolygonData, BuildingTypeFilters, BuildingType } from '@/types/buildings.types';
import { api } from '@/services/api';
import { BUILDING_COLORS } from '@/config/buildingColors.config';

export function BuildingPolygonsViewer() {
  const [data, setData] = useState<BuildingPolygonData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(false);
  const [gridSize, setGridSize] = useState(8);

  // Filter state for building types
  const [typeFilters, setTypeFilters] = useState<BuildingTypeFilters>({
    Pub: true,
    Restaurant: true,
    Apartment: true,
    Employer: true,
    School: true,
  });

  // Load building data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const buildings = await api.fetchBuildingPolygons();
        setData(buildings);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load building data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle type filter toggle
  const handleTypeFilterToggle = (type: BuildingType) => {
    setTypeFilters((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="max-w-md border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive text-center">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-8xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Building Types Map
            </h1>
            <p className="text-muted-foreground">
              Visualize buildings by type with interactive filtering
            </p>
          </div>
        </div>

        {/* Building Type Filters & Grid Toggle */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-4">Building Type Filters</h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {(Object.keys(typeFilters) as BuildingType[]).map((type) => {
                    const color = BUILDING_COLORS[type];
                    const count = data.filter((b) => b.building_type === type).length;
                    return (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox
                          id={`filter-${type}`}
                          checked={typeFilters[type]}
                          onCheckedChange={() => handleTypeFilterToggle(type)}
                        />
                        <Label
                          htmlFor={`filter-${type}`}
                          className="flex items-center gap-2 cursor-pointer text-sm font-medium"
                        >
                          <div
                            className="w-4 h-4 rounded border"
                            style={{ backgroundColor: color }}
                          />
                          <span>{type}</span>
                          <span className="text-muted-foreground">({count})</span>
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="border-t pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="grid-toggle" className="text-sm font-medium cursor-pointer">
                      Show Coordinate Grid
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Display grid overlay with letter-number coordinates
                    </p>
                  </div>
                  <Switch
                    id="grid-toggle"
                    checked={showGrid}
                    onCheckedChange={setShowGrid}
                  />
                </div>

                {showGrid && (
                  <div className="space-y-2">
                    <Label htmlFor="grid-size" className="text-sm font-medium">
                      Grid Size: {gridSize}x{gridSize}
                    </Label>
                    <div className="flex items-center gap-4 w-1/4">
                      <input
                        id="grid-size"
                        type="range"
                        min="2"
                        max="16"
                        step="1"
                        value={gridSize}
                        onChange={(e) => setGridSize(parseInt(e.target.value))}
                        className="flex-1"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Map Visualization */}
        <Card>
          <CardContent className="pt-6 flex justify-center">
            <BuildingPolygons data={data} typeFilters={typeFilters} showGrid={showGrid} gridSize={gridSize} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
