import { useState } from "react";
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
import { LoadingSpinner } from "./LoadingSpinner";
import { SettingsPanel } from "./SettingsPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useHeatmapData } from "@/hooks/useHeatmapData";
import { usePlayback } from "@/hooks/usePlayback";

export function HeatmapViewer() {
  const [showDataConfig, setShowDataConfig] = useState(true);
  const [useConstantScale, setUseConstantScale] = useState(false);
  const [cellSize, setCellSize] = useState(50);
  const [timeBucketMinutes, setTimeBucketMinutes] = useState(30);
  const [startDate, setStartDate] = useState("2022-03-21");
  const [startTime, setStartTime] = useState("00:00");
  const [endDate, setEndDate] = useState("2022-03-22");
  const [endTime, setEndTime] = useState("00:00");

  const {
    heatmapData,
    globalMaxCount,
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

  const currentTimestamp = timestamps[currentTimeIndex];
  const currentData = currentTimestamp ? heatmapData[currentTimestamp] : [];

  const handleApplySettings = () => {
    setShowDataConfig(false);
    fetchData({
      startDate,
      startTime,
      endDate,
      endTime,
      cellSize,
      timeBucketMinutes,
    });
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
      <div className="max-w-7xl mx-auto space-y-6">
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
            timeBucketMinutes={timeBucketMinutes}
            setTimeBucketMinutes={setTimeBucketMinutes}
            handleApplySettings={handleApplySettings}
            handleCancel={() => setShowDataConfig(false)}
          />
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
                  <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
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

                    {/* Constant Scale Toggle */}
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
