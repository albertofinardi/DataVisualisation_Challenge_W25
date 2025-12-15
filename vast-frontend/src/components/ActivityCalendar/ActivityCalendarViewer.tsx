import { useState } from "react";
import { Settings } from "lucide-react";
import { ActivityCalendar } from "./ActivityCalendar";
import { LoadingSpinner } from "../LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useActivityCalendarData } from "@/hooks/useActivityCalendarData";

export function ActivityCalendarViewer() {
  const [showDataConfig, setShowDataConfig] = useState(true);
  const [startDate, setStartDate] = useState("2022-03-01");
  const [startTime, setStartTime] = useState("00:00");
  const [endDate, setEndDate] = useState("2022-03-31");
  const [endTime, setEndTime] = useState("23:59");
  const [selectedParticipant, setSelectedParticipant] = useState<string>("1");
  const [displayedParticipant, setDisplayedParticipant] = useState<string>("1");

  const {
    calendarData,
    loading,
    error,
    fetchData,
  } = useActivityCalendarData();

  const handleApplySettings = () => {
    setShowDataConfig(false);
    setDisplayedParticipant(selectedParticipant);
    fetchData({
      startDate,
      startTime,
      endDate,
      endTime,
      participantId: parseInt(selectedParticipant),
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

  const hasData = Object.keys(calendarData).length > 0;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Activity Timeline Calendar
            </h1>
            <p className="text-muted-foreground">
              Visualize daily activity patterns for individual participants
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
            {/* Participant Selection */}
            <div className="space-y-2">
              <Label htmlFor="participant-input" className="text-sm font-medium">
                Participant (1-1011)
              </Label>
              <Input
                id="participant-input"
                type="number"
                min="1"
                max="1011"
                value={selectedParticipant}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val) && val >= 1 && val <= 1011) {
                    setSelectedParticipant(String(val));
                  } else if (e.target.value === '') {
                    setSelectedParticipant('');
                  }
                }}
                placeholder="Enter participant number (1-1011)"
                className="w-full"
              />
            </div>

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

            {/* Info text */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> This visualization shows the dominant activity for each hour of each day
                for the selected participant. The activity is determined by the most frequent status during that hour.
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

        {hasData && (
          <Card>
            <CardContent className="pt-6">
              <div className="mb-4">
                <h2 className="text-xl font-semibold">
                  Participant {displayedParticipant}
                </h2>
              </div>
              <ActivityCalendar data={calendarData} />
            </CardContent>
          </Card>
        )}

        {!hasData && !showDataConfig && (
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
