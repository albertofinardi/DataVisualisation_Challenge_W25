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
import { Streamgraph } from "./Streamgraph";
import { LoadingSpinner } from "../LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useStreamgraphData } from "@/hooks/useStreamgraphData";
import { STREAMGRAPH_CONFIG } from "@/config/streamgraph.config";

// Time bucket options: minutes
const TIME_BUCKET_OPTIONS = [
  { label: '15 mins', value: 15 },
  { label: '30 mins', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '6 hours', value: 360 },
  { label: '12 hours', value: 720 },
  { label: '24 hours', value: 1440 },
  { label: '7 days', value: 10080 },
  { label: '1 month', value: 43200 },
];

export function StreamgraphViewer() {
  const [showDataConfig, setShowDataConfig] = useState(true);
  const [timeBucketIndex, setTimeBucketIndex] = useState(2); // Default to 1 hour
  const [startDate, setStartDate] = useState("2022-03-21");
  const [startTime, setStartTime] = useState("03:00");
  const [endDate, setEndDate] = useState("2022-03-22");
  const [endTime, setEndTime] = useState("03:00");
  const [selectedInterestGroups, setSelectedInterestGroups] = useState<string[]>([]);

  const timeBucketMinutes = TIME_BUCKET_OPTIONS[timeBucketIndex].value;

  const {
    streamgraphData,
    timestamps,
    loading,
    error,
    fetchData,
    clearSelectedActivity,
  } = useStreamgraphData();

  const handleApplySettings = () => {
    setShowDataConfig(false);
    fetchData({
      startDate,
      startTime,
      endDate,
      endTime,
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

  // Check if date range is valid (at least as long as the time bucket)
  const isDateRangeValid = () => {
    const start = new Date(`${startDate}T${startTime}:00`);
    const end = new Date(`${endDate}T${endTime}:00`);
    const diffMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    return diffMinutes >= timeBucketMinutes * 2;
  };

  const canApplySettings = isDateRangeValid();

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
              Activity Streamgraph Viewer
            </h1>
            <p className="text-muted-foreground">
              Visualize participant activity patterns over time
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
            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="start-date" className="text-sm font-medium">
                    Start Date & Time
                  </Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      id="start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-32"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="end-date" className="text-sm font-medium">
                    End Date & Time
                  </Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      id="end-date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-32"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Time Bucket */}
            <div className="space-y-2">
              <Label className="flex items-center justify-between text-sm font-medium">
                <span>Time Bucket</span>
                <span className="text-accent font-semibold">{TIME_BUCKET_OPTIONS[timeBucketIndex].label}</span>
              </Label>
              <Slider
                value={[timeBucketIndex]}
                onValueChange={(v) => setTimeBucketIndex(v[0])}
                min={0}
                max={TIME_BUCKET_OPTIONS.length - 1}
                step={1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Aggregate data into {TIME_BUCKET_OPTIONS[timeBucketIndex].label} intervals
              </p>
            </div>

            {/* Interest Groups Filter */}
            <div className="space-y-3">
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
                  : `Showing data for ${selectedInterestGroups.length} selected group${selectedInterestGroups.length !== 1 ? 's' : ''}`}
              </p>
            </div>

            {/* Validation Message */}
            {!canApplySettings && (
              <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                <p className="text-sm text-destructive">
                  Date range must be at least 2x {TIME_BUCKET_OPTIONS[timeBucketIndex].label} long.
                  Current selection is too short for the selected time bucket.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <Button
                onClick={() => setShowDataConfig(false)}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                onClick={handleApplySettings}
                className="bg-accent hover:bg-accent/90"
                disabled={!canApplySettings}
              >
                Apply Settings
              </Button>
            </div>
          </div>
        </CollapsibleCard>

        {timestamps.length > 0 && (
          <>

            {/* Streamgraph */}
            <Card>
              <CardContent className="pt-6">
                <Streamgraph
                  data={streamgraphData}
                />
              </CardContent>
            </Card>
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
