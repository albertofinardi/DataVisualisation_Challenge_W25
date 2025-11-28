import { useState } from 'react';
import { Settings, MapPin, X } from 'lucide-react';
import { FlowDiagram } from './FlowDiagram';
import { LoadingSpinner } from '../LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CollapsibleCard } from '@/components/ui/collapsible-card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useFlowData } from '@/hooks/useFlowData';
import { FLOW_CONFIG } from '@/config/flow.config';
import type { FlowNode, FlowLink } from '@/types/flow.types';

export function FlowDiagramViewer() {
  const [showDataConfig, setShowDataConfig] = useState(true);
  const [cellSize, setCellSize] = useState(FLOW_CONFIG.defaultCellSize);
  const [minTripCount, setMinTripCount] = useState(FLOW_CONFIG.minTripCount);
  const [startDate, setStartDate] = useState(FLOW_CONFIG.defaultDateRange.startDate);
  const [startTime, setStartTime] = useState(FLOW_CONFIG.defaultDateRange.startTime);
  const [endDate, setEndDate] = useState(FLOW_CONFIG.defaultDateRange.endDate);
  const [endTime, setEndTime] = useState(FLOW_CONFIG.defaultDateRange.endTime);
  const [selectedNode, setSelectedNode] = useState<FlowNode | null>(null);
  const [selectedLink, setSelectedLink] = useState<FlowLink | null>(null);

  const { flows, nodes, links, loading, error, fetchData, clearError } = useFlowData();

  const handleApplySettings = () => {
    setShowDataConfig(false);
    fetchData({
      startDate,
      startTime,
      endDate,
      endTime,
      cellSize,
      minTripCount,
    });
  };

  const handleNodeClick = (node: FlowNode) => {
    setSelectedNode(node);
    setSelectedLink(null);
  };

  const handleLinkClick = (link: FlowLink) => {
    setSelectedLink(link);
    setSelectedNode(null);
  };

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="max-w-md border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive text-center">{error}</p>
            <Button onClick={clearError} className="mt-4 w-full">
              Dismiss
            </Button>
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
              Origin-Destination Flow Diagram
            </h1>
            <p className="text-muted-foreground">
              Visualize movement patterns and traffic flows between locations
            </p>
          </div>
        </div>

        {/* Collapsible Data Configuration */}
        <CollapsibleCard
          title="Data Configuration"
          icon={<Settings className="w-5 h-5" />}
          open={showDataConfig}
          onOpenChange={setShowDataConfig}
          className="border-primary/20"
        >
          <div className="space-y-6">
            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="start-time">Start Time</Label>
                <Input
                  id="start-time"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-time">End Time</Label>
                <Input
                  id="end-time"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>

            {/* Spatial Settings */}
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="cell-size">Cell Size</Label>
                  <span className="text-sm text-muted-foreground">{cellSize}</span>
                </div>
                <Slider
                  id="cell-size"
                  min={25}
                  max={200}
                  step={25}
                  value={[cellSize]}
                  onValueChange={(value) => setCellSize(value[0])}
                />
                <p className="text-xs text-muted-foreground">
                  Larger cell sizes aggregate more trips into fewer nodes
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="min-trip-count">Minimum Trip Count</Label>
                  <span className="text-sm text-muted-foreground">{minTripCount}</span>
                </div>
                <Slider
                  id="min-trip-count"
                  min={1}
                  max={100}
                  step={1}
                  value={[minTripCount]}
                  onValueChange={(value) => setMinTripCount(value[0])}
                />
                <p className="text-xs text-muted-foreground">
                  Filter out flows with fewer trips to reduce visual clutter
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button onClick={handleApplySettings} className="flex-1">
                Apply Settings
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowDataConfig(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </CollapsibleCard>

        {/* Visualization */}
        {nodes.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Flow Diagram */}
            <Card className="lg:col-span-3">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Flow Visualization</h2>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {nodes.length} locations, {links.length} flows
                      </span>
                    </div>
                  </div>
                  <div className="border rounded-lg overflow-hidden bg-muted/10">
                    <FlowDiagram
                      nodes={nodes}
                      links={links}
                      selectedNode={selectedNode}
                      onNodeClick={handleNodeClick}
                      onLinkClick={handleLinkClick}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>• Node size represents total traffic (inbound + outbound trips)</p>
                    <p>• Arrow width represents number of trips along that route</p>
                    <p>• Curved arrows show directional flows overlaid on the city map</p>
                    <p>• Hover over nodes and arrows for detailed information</p>
                    <p>• Click on nodes or flows to see details in the side panel</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Details Panel */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Details</h2>
                    {(selectedNode || selectedLink) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedNode(null);
                          setSelectedLink(null);
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  {!selectedNode && !selectedLink && (
                    <div className="text-center text-muted-foreground py-8">
                      <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Click on a node or flow to see details</p>
                    </div>
                  )}

                  {selectedNode && (
                    <div className="space-y-3">
                      <div className="border-b pb-2">
                        <h3 className="font-semibold text-lg">Location Node</h3>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Grid Position:</span>
                          <span className="font-medium">
                            ({selectedNode.grid_x}, {selectedNode.grid_y})
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Coordinates:</span>
                          <span className="font-medium">
                            ({selectedNode.longitude.toFixed(2)}, {selectedNode.latitude.toFixed(2)})
                          </span>
                        </div>
                        <div className="border-t pt-2 mt-2">
                          <div className="flex justify-between mb-1">
                            <span className="text-muted-foreground">Outbound Trips:</span>
                            <span className="font-medium">
                              {selectedNode.total_outbound.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between mb-1">
                            <span className="text-muted-foreground">Inbound Trips:</span>
                            <span className="font-medium">
                              {selectedNode.total_inbound.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between font-semibold pt-2 border-t">
                            <span>Total Traffic:</span>
                            <span>
                              {(selectedNode.total_outbound + selectedNode.total_inbound).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedLink && (
                    <div className="space-y-3">
                      <div className="border-b pb-2">
                        <h3 className="font-semibold text-lg">Flow Connection</h3>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-muted-foreground block mb-1">Origin:</span>
                          <span className="font-medium">{selectedLink.source}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block mb-1">Destination:</span>
                          <span className="font-medium">{selectedLink.target}</span>
                        </div>
                        <div className="border-t pt-2 mt-2">
                          <div className="flex justify-between mb-1">
                            <span className="text-muted-foreground">Total Trips:</span>
                            <span className="font-medium text-lg">
                              {selectedLink.value.toLocaleString()}
                            </span>
                          </div>
                          {selectedLink.avg_duration_minutes && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Avg Duration:</span>
                              <span className="font-medium">
                                {selectedLink.avg_duration_minutes.toFixed(1)} min
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Summary Stats */}
                  <div className="border-t pt-4 mt-4">
                    <h3 className="font-semibold mb-3">Summary Statistics</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Locations:</span>
                        <span className="font-medium">{nodes.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Flows:</span>
                        <span className="font-medium">{links.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Trips:</span>
                        <span className="font-medium">
                          {flows.reduce((sum, f) => sum + f.trip_count, 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {nodes.length === 0 && !loading && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground py-8">
                No flow data available. Adjust the settings and click "Apply Settings" to load data.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
