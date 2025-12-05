import { useState } from "react";
import { Settings, Play, Pause, SkipBack, SkipForward, Clock } from "lucide-react";
import { RouteMap } from "./RouteMap";
import { ParticipantInfoPanel } from "./ParticipantInfoPanel";
import { LoadingSpinner } from "../LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useParticipantComparison } from "@/hooks/useParticipantComparison";
import { usePlayback } from "@/hooks/usePlayback";

export function ParticipantComparisonViewer() {
  const [showDataConfig, setShowDataConfig] = useState(true);
  const [startDate, setStartDate] = useState("2022-03-01");
  const [startTime, setStartTime] = useState("00:00");
  const [endDate, setEndDate] = useState("2022-03-31");
  const [endTime, setEndTime] = useState("23:59");
  const [participant1, setParticipant1] = useState<string>("1");
  const [participant2, setParticipant2] = useState<string>("2");
  const trailLength = 50;

  const { data, loading, error, fetchData } = useParticipantComparison();

  const handleApplySettings = () => {
    const p1 = parseInt(participant1);
    const p2 = parseInt(participant2);
    
    if (isNaN(p1) || isNaN(p2) || p1 < 1 || p1 > 1011 || p2 < 1 || p2 > 1011) {
      alert('Please enter valid participant IDs (1-1011)');
      return;
    }
    
    if (p1 === p2) {
      alert('Please select two different participants');
      return;
    }
    
    setShowDataConfig(false);
    fetchData({
      participant1: p1,
      participant2: p2,
      startDate,
      startTime,
      endDate,
      endTime,
    });
  };

  // Get max timeline length for playback
  const maxTimelineLength = data 
    ? Math.max(
        data.participants[participant1]?.timeline?.length || 0,
        data.participants[participant2]?.timeline?.length || 0
      )
    : 0;

  const {
    currentTimeIndex,
    isPlaying,
    playbackSpeed,
    setPlaybackSpeed,
    togglePlayPause,
    next,
    previous,
    goToFrame,
  } = usePlayback(maxTimelineLength, 100, 10); // 100ms base interval, 10x default speed

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

  const hasData = data !== null;
  const p1Data = hasData ? data.participants[participant1] : null;
  const p2Data = hasData ? data.participants[participant2] : null;

  // Get current timestamp
  const getCurrentTimestamp = () => {
    if (!hasData) return null;
    
    const p1Point = p1Data?.timeline[currentTimeIndex];
    const p2Point = p2Data?.timeline[currentTimeIndex];
    
    return p1Point?.timestamp || p2Point?.timestamp || null;
  };

  const currentTimestamp = getCurrentTimestamp();

  return (
    <div className="min-h-screen bg-background p-6 overflow-x-auto">
      <div className="min-w-min space-y-6" style={{ width: 'fit-content', minWidth: '100%' }}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Participant Comparison
            </h1>
            <p className="text-muted-foreground">
              Compare daily routines and travel patterns of two participants
            </p>
          </div>
        </div>

        {/* Data Configuration */}
        <CollapsibleCard
          title="Data Configuration"
          icon={<Settings className="w-5 h-5" />}
          open={showDataConfig}
          onOpenChange={setShowDataConfig}
          className="border-coral/20"
        >
          <div className="space-y-6">
            {/* Participant Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="participant1-input" className="text-sm font-medium">
                  Participant 1 (1-1011)
                </Label>
                <Input
                  id="participant1-input"
                  type="number"
                  min="1"
                  max="1011"
                  value={participant1}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val) && val >= 1 && val <= 1011) {
                      setParticipant1(String(val));
                    } else if (e.target.value === '') {
                      setParticipant1('');
                    }
                  }}
                  placeholder="Enter participant number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="participant2-input" className="text-sm font-medium">
                  Participant 2 (1-1011)
                </Label>
                <Input
                  id="participant2-input"
                  type="number"
                  min="1"
                  max="1011"
                  value={participant2}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val) && val >= 1 && val <= 1011) {
                      setParticipant2(String(val));
                    } else if (e.target.value === '') {
                      setParticipant2('');
                    }
                  }}
                  placeholder="Enter participant number"
                />
              </div>
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

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button onClick={handleApplySettings} className="bg-accent hover:bg-accent/90">
                Load Data
              </Button>
              <Button onClick={() => setShowDataConfig(false)} variant="outline">
                Cancel
              </Button>
            </div>
          </div>
        </CollapsibleCard>

        {hasData && p1Data && p2Data && (
          <>
            {/* Playback Controls */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  {/* Time Info */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-muted-foreground" />
                      <span className="text-lg font-medium">
                        {currentTimestamp 
                          ? new Date(currentTimestamp).toLocaleString()
                          : 'No data at this position'}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      Frame {currentTimeIndex + 1} of {maxTimelineLength}
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
                      disabled={currentTimeIndex === maxTimelineLength - 1}
                    >
                      <SkipForward className="w-4 h-4" />
                    </Button>

                    <div className="flex-1 px-4">
                      <Slider
                        value={[currentTimeIndex]}
                        onValueChange={(v) => goToFrame(v[0])}
                        max={maxTimelineLength - 1}
                        step={1}
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Settings */}
                  <div className="border-t pt-4">
                    {/* Playback Speed */}
                    <div className="space-y-2">
                      <Label className="flex items-center justify-between text-sm font-medium">
                        <span>Playback Speed</span>
                        <span className="text-muted-foreground">{playbackSpeed}x</span>
                      </Label>
                      <Slider
                        value={[playbackSpeed]}
                        onValueChange={(v) => setPlaybackSpeed(v[0])}
                        min={0.25}
                        max={50}
                        step={0.25}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Main Visualization: 3-column layout */}
            <div className="grid grid-cols-12 gap-4">
              {/* Left Panel - Participant 1 Info */}
              <div className="col-span-2">
                <ParticipantInfoPanel
                  participantId={participant1}
                  info={p1Data.info}
                  activityDistribution={p1Data.activityDistribution}
                />
              </div>

              {/* Center - Map */}
              <div className="col-span-8">
                <Card>
                  <CardContent className="pt-6">
                    <RouteMap
                      participant1Timeline={p1Data.timeline}
                      participant2Timeline={p2Data.timeline}
                      currentTimeIndex={currentTimeIndex}
                      trailLength={trailLength}
                      participant1Id={participant1}
                      participant2Id={participant2}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Right Panel - Participant 2 Info */}
              <div className="col-span-2">
                <ParticipantInfoPanel
                  participantId={participant2}
                  info={p2Data.info}
                  activityDistribution={p2Data.activityDistribution}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
