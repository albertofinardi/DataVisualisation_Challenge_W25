import { useState, useEffect } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  X,
  Settings,
  Clock,
} from "lucide-react";
import { Heatmap } from "./Heatmap";
import { LoadingSpinner } from "../LoadingSpinner";
import { SettingsPanel, TIME_BUCKET_OPTIONS } from "../SettingsPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useHeatmapData } from "@/hooks/useHeatmapData";
import { usePlayback } from "@/hooks/usePlayback";
import { STREAMGRAPH_CONFIG } from "@/config/streamgraph.config";
import { api } from "@/services/api";
import type { BuildingPolygonData } from "@/types/buildings.types";
import { cn } from "@/lib/utils";

export function HeatmapViewer() {
  const [showDataConfig, setShowDataConfig] = useState(true);
  const [useConstantScale, setUseConstantScale] = useState(false);
  const [cellSize, setCellSize] = useState(25);
  const [timeBucketIndex, setTimeBucketIndex] = useState(1); // Default to 30 mins (index 1)
  const [startDate, setStartDate] = useState("2022-03-21");
  const [startTime, setStartTime] = useState("00:00");
  const [endDate, setEndDate] = useState("2022-03-22");
  const [endTime, setEndTime] = useState("00:00");
  const [selectedInterestGroups, setSelectedInterestGroups] = useState<string[]>([]);
  const [showBuildings, setShowBuildings] = useState(false);
  const [buildingData, setBuildingData] = useState<BuildingPolygonData[]>([]);
  const [useGroupColors, setUseGroupColors] = useState(false);

  const timeBucketMinutes = TIME_BUCKET_OPTIONS[timeBucketIndex].value;

  const {
    heatmapData,
    globalMaxCount,
    groupMaxCounts,
    timestamps,
    loading,
    error,
    selectedCell,
    fetchData,
    selectCell,
    clearSelectedCell,
  } = useHeatmapData();

  const {
    currentTimeIndex,
    isPlaying,
    playbackSpeed,
    setPlaybackSpeed,
    togglePlayPause,
    next,
    previous,
    goToFrame,
  } = usePlayback(timestamps.length, 1000); // 1000ms base interval = 1 second per frame at 1x speed

  // Load building data on mount
  useEffect(() => {
    const loadBuildings = async () => {
      try {
        const buildings = await api.fetchBuildingPolygons();
        setBuildingData(buildings);
      } catch (err) {
        console.error('Failed to load building data:', err);
      }
    };
    loadBuildings();
  }, []);

  const currentTimestamp = timestamps[currentTimeIndex];
  const currentData = currentTimestamp ? heatmapData[currentTimestamp] : [];

  // Check if date range is valid (at least as long as the time bucket)
  const isDateRangeValid = () => {
    const start = new Date(`${startDate}T${startTime}:00`);
    const end = new Date(`${endDate}T${endTime}:00`);
    const diffMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    return diffMinutes >= timeBucketMinutes * 2;
  };

  const canApplySettings = isDateRangeValid();

  const handleApplySettings = () => {
    setShowDataConfig(false);
    fetchData({
      startDate,
      startTime,
      endDate,
      endTime,
      cellSize,
      timeBucketMinutes,
      interestGroups: selectedInterestGroups.length > 0 ? selectedInterestGroups : undefined,
    });
  };

  const handleInterestGroupToggle = (group: string) => {
    setSelectedInterestGroups((prev) =>
      prev.includes(group)
        ? prev.filter((g) => g !== group)
        : [...prev, group]
    );
  };

  const handleSelectAllInterestGroups = () => {
    if (selectedInterestGroups.length === STREAMGRAPH_CONFIG.interestGroups.length) {
      setSelectedInterestGroups([]);
    } else {
      setSelectedInterestGroups([...STREAMGRAPH_CONFIG.interestGroups]);
    }
  };

  const handleCellClick = (cell: { grid_x: number; grid_y: number }) => {
    // Find the full cell data from current data
    const fullCellData = currentData.find(
      (d) => d.grid_x === cell.grid_x && d.grid_y === cell.grid_y
    );
    if (fullCellData) {
      selectCell(fullCellData, currentTimestamp);
    }
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
              Location Heatmap Viewer
            </h1>
            <p className="text-muted-foreground">
              Visualize participant movement patterns over time
            </p>
          </div>
        </div>

        {/* Collapsible Data Configuration */}
        <CollapsibleCard
          title="Data Configuration"
          icon={<Settings className="w-5 h-5" />}
          open={showDataConfig}
          onOpenChange={setShowDataConfig}
          className="border-coral/20"
        >
          <div className="space-y-6">
            <SettingsPanel
              startDate={startDate}
              setStartDate={setStartDate}
              startTime={startTime}
              setStartTime={setStartTime}
              endDate={endDate}
              setEndDate={setEndDate}
              endTime={endTime}
              setEndTime={setEndTime}
              cellSize={cellSize}
              setCellSize={setCellSize}
              timeBucketIndex={timeBucketIndex}
              setTimeBucketIndex={setTimeBucketIndex}
              handleApplySettings={handleApplySettings}
              handleCancel={() => setShowDataConfig(false)}
              canApplySettings={canApplySettings}
            />

            {/* Interest Groups Filter */}
            <div className="border-t pt-6 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">
                  Filter by Interest Groups
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAllInterestGroups}
                  className="h-8 text-xs"
                >
                  {selectedInterestGroups.length === STREAMGRAPH_CONFIG.interestGroups.length
                    ? 'Deselect All'
                    : 'Select All'}
                </Button>
              </div>
              <div className="grid grid-cols-5 gap-3 p-4 border rounded-lg bg-muted/30">
                {STREAMGRAPH_CONFIG.interestGroups.map((group) => (
                  <div key={group} className="flex items-center space-x-2">
                    <Checkbox
                      id={`interest-${group}`}
                      checked={selectedInterestGroups.includes(group)}
                      onCheckedChange={() => handleInterestGroupToggle(group)}
                    />
                    <label
                      htmlFor={`interest-${group}`}
                      className="text-sm font-medium leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Group {group}
                    </label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedInterestGroups.length === 0
                  ? 'All interest groups will be included'
                  : `Showing data for ${selectedInterestGroups.length} selected group${selectedInterestGroups.length !== 1 ? 's' : ''} with distinct color scales`}
              </p>
            </div>
          </div>
        </CollapsibleCard>

        {timestamps.length > 0 && (
          <>
            {/* Playback Controls & Visualization Settings */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  {/* Time Info */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-muted-foreground" />
                      <span className="text-lg font-medium">
                        {new Date(currentTimestamp).toLocaleString()}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      Frame {currentTimeIndex + 1} of {timestamps.length}
                    </span>
                  </div>

                  {/* Playback Controls */}
                  <div className="flex items-center gap-4">
                    <Button
                      onClick={previous}
                      variant="outline"
                      size="icon"
                      disabled={currentTimeIndex === 0}
                    >
                      <SkipBack className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={togglePlayPause}
                      size="icon"
                      className="bg-accent hover:bg-accent/90"
                    >
                      {isPlaying ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      onClick={next}
                      variant="outline"
                      size="icon"
                      disabled={currentTimeIndex === timestamps.length - 1}
                    >
                      <SkipForward className="w-4 h-4" />
                    </Button>

                    <div className="flex-1 px-4">
                      <Slider
                        value={[currentTimeIndex]}
                        onValueChange={(v) => goToFrame(v[0])}
                        max={timestamps.length - 1}
                        step={1}
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Visualization Settings */}
                  <div className="border-t pt-4 space-y-4">
                    <div className={cn("grid grid-cols-1 gap-4", useGroupColors ? "md:grid-cols-2" : "md:grid-cols-3")}>
                      {/* Playback Speed */}
                      <div className="space-y-2">
                        <Label className="flex items-center justify-between text-sm font-medium">
                          <span>Playback Speed</span>
                          <span className="text-accent font-semibold">
                            {playbackSpeed.toFixed(1)}x
                          </span>
                        </Label>
                        <Slider
                          value={[playbackSpeed]}
                          onValueChange={(v) => setPlaybackSpeed(v[0])}
                          min={0.1}
                          max={5}
                          step={0.1}
                          className="w-full"
                        />
                      </div>

                      {/* Constant Scale Toggle - Hidden when using separate group colors */}
                      {!useGroupColors && (
                        <div className="flex items-center justify-between py-2 px-4 bg-slate-light dark:bg-slate-light/10 rounded-lg border border-border">
                          <div className="space-y-0.5">
                            <Label className="text-sm font-medium">
                              Constant Scale
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              Use consistent color scale across all frames
                            </p>
                          </div>
                          <Switch
                            checked={useConstantScale}
                            onCheckedChange={setUseConstantScale}
                          />
                        </div>
                      )}

                      {/* Show Buildings Toggle */}
                      <div className="flex items-center justify-between py-2 px-4 bg-slate-light dark:bg-slate-light/10 rounded-lg border border-border">
                        <div className="space-y-0.5">
                          <Label className="text-sm font-medium">
                            Show Buildings
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Overlay building polygons on the map
                          </p>
                        </div>
                        <Switch
                          checked={showBuildings}
                          onCheckedChange={setShowBuildings}
                        />
                      </div>
                    </div>

                    {/* Group Color Mode Toggle - Only show when groups are selected */}
                    {selectedInterestGroups.length > 0 && (
                      <div className="flex items-center justify-between py-2 px-4 bg-accent/10 rounded-lg border border-accent/30">
                        <div className="space-y-0.5">
                          <Label className="text-sm font-medium">
                            Separate Group Colors
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            {timestamps.length === 0
                              ? 'Apply settings first to load filtered data'
                              : 'Show each interest group with distinct color scales'}
                          </p>
                        </div>
                        <Switch
                          checked={useGroupColors}
                          onCheckedChange={setUseGroupColors}
                          disabled={timestamps.length === 0}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Heatmap */}
            <div className="relative">
              <Heatmap
                data={currentData}
                cellSize={cellSize}
                onCellClick={handleCellClick}
                selectedCell={selectedCell}
                maxCount={useConstantScale ? globalMaxCount : undefined}
                groupMaxCounts={groupMaxCounts}
                selectedInterestGroups={selectedInterestGroups}
                buildingData={buildingData}
                showBuildings={showBuildings}
                useGroupColors={useGroupColors}
              />
            </div>

            {/* Selected Cell Details */}
            {selectedCell && (
              <Card className="border-accent">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold">Cell Details</h3>
                    <Button
                      onClick={clearSelectedCell}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">
                        Grid Position:
                      </span>
                      <p className="font-medium">
                        ({selectedCell.grid_x}, {selectedCell.grid_y})
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Count:</span>
                      <p className="font-medium text-accent">
                        {selectedCell.count}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">
                        Center Location:
                      </span>
                      <p className="font-medium">
                        ({selectedCell.center_longitude.toFixed(4)},{" "}
                        {selectedCell.center_latitude.toFixed(4)})
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {timestamps.length === 0 && !showDataConfig && (
          <Card className="border-dashed">
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">
                No data loaded. Please configure settings and fetch data.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
