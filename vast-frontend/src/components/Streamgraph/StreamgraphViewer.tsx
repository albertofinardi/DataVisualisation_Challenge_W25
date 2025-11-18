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
import { useStreamgraphData } from "@/hooks/useStreamgraphData";

export function StreamgraphViewer() {
  const [showDataConfig, setShowDataConfig] = useState(true);
  const [timeBucketMinutes, setTimeBucketMinutes] = useState(60);
  const [startDate, setStartDate] = useState("2022-03-21");
  const [startTime, setStartTime] = useState("03:00");
  const [endDate, setEndDate] = useState("2022-03-22");
  const [endTime, setEndTime] = useState("03:00");

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
    });
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
                <span>Time Bucket (minutes)</span>
                <span className="text-accent font-semibold">{timeBucketMinutes}</span>
              </Label>
              <Slider
                value={[timeBucketMinutes]}
                onValueChange={(v) => setTimeBucketMinutes(v[0])}
                min={1}
                max={120}
                step={1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Aggregate data into {timeBucketMinutes}-minute intervals
              </p>
            </div>

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
