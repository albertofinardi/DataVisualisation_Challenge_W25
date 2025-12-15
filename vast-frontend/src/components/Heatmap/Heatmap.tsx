import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { MAP_CONFIG } from '@/config/map.config';
import type { LocationDataPoint, LocationDetails } from '@/types/heatmap.types';
import type { BuildingPolygonData } from '@/types/buildings.types';
import { createQuantizeScale, getHoverColor, getSelectedColor, createInterestGroupScale } from '@/services/colorScale';
import type { ColorScheme } from '@/services/colorScale';
import { getBuildingColor } from '@/config/buildingColors.config';
import BaseMapImage from '@/assets/BaseMap.png';

interface HeatmapProps {
  data: LocationDataPoint[];
  cellSize: number;
  onCellClick?: (details: { grid_x: number; grid_y: number }) => void;
  selectedCell?: LocationDetails | null;
  maxCount?: number;
  groupMaxCounts?: Record<string, number>;
  colorScheme?: ColorScheme;
  selectedInterestGroups?: string[];
  buildingData?: BuildingPolygonData[];
  showBuildings?: boolean;
  useGroupColors?: boolean;
}

export function Heatmap({
  data,
  cellSize,
  onCellClick,
  selectedCell,
  maxCount,
  groupMaxCounts = {},
  colorScheme = 'coral',
  selectedInterestGroups = [],
  buildingData = [],
  showBuildings = false,
  useGroupColors = false,
}: HeatmapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; content: string } | null>(null);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { width, height, padding } = MAP_CONFIG.visual;
    const { bounds } = MAP_CONFIG;

    // Create coordinate scales with padding
    const xScale = d3
      .scaleLinear()
      .domain([bounds.minLongitude, bounds.maxLongitude])
      .range([padding.left, width - padding.right]);

    const yScale = d3
      .scaleLinear()
      .domain([bounds.maxLatitude, bounds.minLatitude])
      .range([padding.top, height - padding.bottom]);

    // Determine if we're using interest group coloring
    // We can use group colors if the toggle is on AND data has interest_group field
    const hasInterestGroupData = data.length > 0 && data.some(d => d.interest_group !== undefined && d.interest_group !== null);
    const shouldUseGroupColors = useGroupColors && hasInterestGroupData;

    // Group data by interest_group if present
    const dataByGroup: Record<string, LocationDataPoint[]> = {};
    if (shouldUseGroupColors) {
      data.forEach((point) => {
        // Only group points that have a valid interest_group
        if (point.interest_group !== undefined && point.interest_group !== null && point.interest_group !== '') {
          const group = point.interest_group;
          if (!dataByGroup[group]) {
            dataByGroup[group] = [];
          }
          dataByGroup[group].push(point);
        }
      });
    }

    // Create color scale using the color service
    const scaleMaxCount = maxCount ?? (d3.max(data, (d) => parseInt(d.count)) || 1);
    const colorScale = createQuantizeScale([0, scaleMaxCount], colorScheme);

    // Debug logging
    console.log('Heatmap Render Debug:', {
      useGroupColors,
      dataLength: data.length,
      firstFewPoints: data.slice(0, 3),
      hasInterestGroupData,
      shouldUseGroupColors,
      dataByGroupKeys: Object.keys(dataByGroup),
      dataByGroupCounts: Object.entries(dataByGroup).map(([k, v]) => ({ group: k, count: v.length })),
      groupMaxCounts,
      maxCount,
      scaleMaxCount
    });

    if (useGroupColors && !hasInterestGroupData) {
      console.warn('Group colors enabled but no interest_group data available. Make sure to select interest groups and fetch data.');
    }

    // Create color scales for each interest group using their specific max counts
    const interestGroupScales: Record<string, ReturnType<typeof createInterestGroupScale>> = {};
    if (shouldUseGroupColors) {
      Object.keys(dataByGroup).forEach((group) => {
        // Use the group-specific max count if available, otherwise fall back to overall max
        const groupMax = groupMaxCounts[group] || maxCount || scaleMaxCount;
        interestGroupScales[group] = createInterestGroupScale([0, groupMax], group);
      });
    }

    // Get colors
    const hoverColor = getHoverColor(colorScheme);
    const selectedColor = getSelectedColor(colorScheme);

    const cellPixelWidth = xScale(cellSize) - xScale(0);
    const cellPixelHeight = yScale(0) - yScale(cellSize);

    // Add SVG filter for Gaussian blur to create smooth interpolation
    const defs = svg.append('defs');
    defs.append('filter')
      .attr('id', 'heatmap-blur')
      .append('feGaussianBlur')
      .attr('in', 'SourceGraphic')
      .attr('stdDeviation', Math.max(cellPixelWidth, cellPixelHeight) * 0.6);

    const g = svg.append('g');

    // Add background map image
    g.append('image')
      .attr('href', BaseMapImage)
      .attr('x', padding.left)
      .attr('y', padding.top)
      .attr('width', width - padding.left - padding.right)
      .attr('height', height - padding.top - padding.bottom)
      .attr('opacity', MAP_CONFIG.image.opacity)
      .attr('preserveAspectRatio', 'none');

    // Add building polygons if enabled
    if (showBuildings && buildingData.length > 0) {
      const buildingsGroup = g.append('g').attr('class', 'buildings');

      buildingsGroup
        .selectAll('path.building')
        .data(buildingData)
        .enter()
        .append('path')
        .attr('class', 'building')
        .attr('d', (d) => {
          const points = d.polygon.map(([x, y]) => [xScale(x), yScale(y)] as [number, number]);
          return d3.line()(points) + 'Z';
        })
        .attr('fill', (d) => getBuildingColor(d.building_type))
        .attr('opacity', MAP_CONFIG.heatmap.buildingOpacity)
        .attr('stroke', (d) => getBuildingColor(d.building_type))
        .attr('stroke-width', 1)
        .style('pointer-events', 'none');
    }

    // Create a group for the heatmap with blur filter
    const heatmapGroup = g.append('g')
      .attr('filter', 'url(#heatmap-blur)');

    // Draw heatmap circles based on whether we're using interest group colors
    if (shouldUseGroupColors) {
      // Render each interest group with its own color scale as separate overlapping layers
      const groups = Object.keys(dataByGroup);
      const numGroups = groups.length;

      console.log('Rendering group colors:', { groups, numGroups });

      groups.forEach((group) => {
        const groupData = dataByGroup[group];
        const groupScale = interestGroupScales[group];
        const filteredData = groupData.filter((d) => parseInt(d.count) >= MAP_CONFIG.heatmap.minCount);

        console.log(`Group ${group}:`, {
          totalPoints: groupData.length,
          filteredPoints: filteredData.length,
          samplePoint: filteredData[0]
        });

        // Create a group for this interest group
        const groupG = heatmapGroup.append('g').attr('class', `group-${group}`);

        groupG.selectAll('circle')
          .data(filteredData)
          .enter()
          .append('circle')
          .attr('cx', (d) => xScale(d.grid_x) + cellPixelWidth / 2)
          .attr('cy', (d) => yScale(d.grid_y + cellSize) + cellPixelHeight / 2)
          .attr('r', Math.max(cellPixelWidth, cellPixelHeight) * 0.8)
          .attr('fill', (d) => groupScale(parseInt(d.count)))
          .attr('opacity', MAP_CONFIG.heatmap.opacity);
      });
    } else {
      // Standard single-color heatmap (aggregated or filtered data)
      heatmapGroup.selectAll('circle')
        .data(data.filter((d) => parseInt(d.count) >= MAP_CONFIG.heatmap.minCount))
        .enter()
        .append('circle')
        .attr('cx', (d) => xScale(d.grid_x) + cellPixelWidth / 2)
        .attr('cy', (d) => yScale(d.grid_y + cellSize) + cellPixelHeight / 2)
        .attr('r', Math.max(cellPixelWidth, cellPixelHeight) * 0.8)
        .attr('fill', (d) => colorScale(parseInt(d.count)))
        .attr('opacity', MAP_CONFIG.heatmap.opacity);
    }

    // Add invisible rectangles for interaction (on top, not blurred)
    g.selectAll('rect.interaction')
      .data(data.filter((d) => parseInt(d.count) >= MAP_CONFIG.heatmap.minCount))
      .enter()
      .append('rect')
      .attr('class', 'interaction')
      .attr('x', (d) => xScale(d.grid_x))
      .attr('y', (d) => yScale(d.grid_y + cellSize))
      .attr('width', cellPixelWidth)
      .attr('height', cellPixelHeight)
      .attr('fill', 'transparent')
      .attr('stroke', 'none')
      .style('cursor', 'pointer')
      .on('mouseenter', function (event, d) {
        d3.select(this)
          .attr('stroke', hoverColor)
          .attr('stroke-width', 2);

        const [mouseX, mouseY] = d3.pointer(event, svg.node());
        const groupInfo = d.interest_group ? `\nGroup: ${d.interest_group}` : '';
        setTooltip({
          x: mouseX,
          y: mouseY,
          content: `Count: ${d.count}${groupInfo}\nLocation: (${d.center_longitude.toFixed(1)}, ${d.center_latitude.toFixed(1)})`,
        });
      })
      .on('mouseleave', function () {
        d3.select(this).attr('stroke', 'none');
        setTooltip(null);
      })
      .on('click', (_event, d) => {
        if (onCellClick) {
          onCellClick({ grid_x: d.grid_x, grid_y: d.grid_y });
        }
      });

    // Highlight selected cell
    if (selectedCell) {
      g.append('rect')
        .attr('x', xScale(selectedCell.grid_x))
        .attr('y', yScale(selectedCell.grid_y + cellSize))
        .attr('width', cellPixelWidth)
        .attr('height', cellPixelHeight)
        .attr('fill', 'none')
        .attr('stroke', selectedColor)
        .attr('stroke-width', 3)
        .attr('rx', 2);
    }

    // Add color scale legend(s)
    const legendWidth = 200;
    const legendHeight = 20;
    const legendX = width + 25;
    const legendSpacing = 50;

    if (shouldUseGroupColors) {
      // Multiple legends for interest groups
      const groups = Object.keys(dataByGroup);
      groups.forEach((group, index) => {
        const legendY = padding.top + 20 + index * legendSpacing;
        const groupScale = interestGroupScales[group];

        // Create gradient for this group
        const gradient = defs.append('linearGradient')
          .attr('id', `legend-gradient-${group}`)
          .attr('x1', '0%')
          .attr('x2', '100%');

        // Use group-specific max count for the gradient
        const groupMax = groupMaxCounts[group] || maxCount || scaleMaxCount;

        const numStops = 10;
        for (let i = 0; i <= numStops; i++) {
          const t = i / numStops;
          const value = groupMax * t;
          gradient.append('stop')
            .attr('offset', `${t * 100}%`)
            .attr('stop-color', groupScale(value));
        }

        // Legend group
        const legend = svg.append('g')
          .attr('class', `legend-${group}`)
          .attr('transform', `translate(${legendX}, ${legendY})`);

        // Legend rectangle with gradient
        legend.append('rect')
          .attr('width', legendWidth)
          .attr('height', legendHeight)
          .style('fill', `url(#legend-gradient-${group})`)
          .attr('stroke', hoverColor)
          .attr('stroke-width', 1)
          .attr('rx', 2);

        // Legend labels
        legend.append('text')
          .attr('x', 0)
          .attr('y', -5)
          .attr('text-anchor', 'start')
          .attr('font-size', '12px')
          .attr('fill', 'currentColor')
          .text('0');

        legend.append('text')
          .attr('x', legendWidth)
          .attr('y', -5)
          .attr('text-anchor', 'end')
          .attr('font-size', '12px')
          .attr('fill', 'currentColor')
          .text(groupMax.toFixed(0));

        legend.append('text')
          .attr('x', legendWidth / 2)
          .attr('y', legendHeight + 15)
          .attr('text-anchor', 'middle')
          .attr('font-size', '11px')
          .attr('fill', 'currentColor')
          .attr('font-weight', '500')
          .text(`Group ${group}`);
      });
    } else {
      // Single legend for standard heatmap
      const legendY = padding.top + 20;

      const gradient = defs.append('linearGradient')
        .attr('id', 'legend-gradient')
        .attr('x1', '0%')
        .attr('x2', '100%');

      const numStops = 10;
      for (let i = 0; i <= numStops; i++) {
        const t = i / numStops;
        const value = scaleMaxCount * t;
        gradient.append('stop')
          .attr('offset', `${t * 100}%`)
          .attr('stop-color', colorScale(value));
      }

      const legend = svg.append('g')
        .attr('class', 'legend')
        .attr('transform', `translate(${legendX}, ${legendY})`);

      legend.append('rect')
        .attr('width', legendWidth)
        .attr('height', legendHeight)
        .style('fill', 'url(#legend-gradient)')
        .attr('stroke', hoverColor)
        .attr('stroke-width', 1)
        .attr('rx', 2);

      legend.append('text')
        .attr('x', 0)
        .attr('y', -5)
        .attr('text-anchor', 'start')
        .attr('font-size', '12px')
        .attr('fill', 'currentColor')
        .text('0');

      legend.append('text')
        .attr('x', legendWidth)
        .attr('y', -5)
        .attr('text-anchor', 'end')
        .attr('font-size', '12px')
        .attr('fill', 'currentColor')
        .text(scaleMaxCount.toFixed(0));

      legend.append('text')
        .attr('x', legendWidth / 2)
        .attr('y', legendHeight + 15)
        .attr('text-anchor', 'middle')
        .attr('font-size', '11px')
        .attr('fill', 'currentColor')
        .attr('font-weight', '500')
        .text('Count');
    }

    // Add building legend if buildings are shown
    if (showBuildings && buildingData.length > 0) {
      const buildingTypes: Array<{ type: string; color: string }> = [
        { type: 'Pub', color: getBuildingColor('Pub') },
        { type: 'Restaurant', color: getBuildingColor('Restaurant') },
        { type: 'Apartment', color: getBuildingColor('Apartment') },
        { type: 'Employer', color: getBuildingColor('Employer') },
        { type: 'School', color: getBuildingColor('School') },
      ];

      const buildingLegendX = padding.left + 20;
      const buildingLegendY = height - padding.bottom - 20 - (buildingTypes.length * 25);
      const buildingLegendGroup = svg.append('g')
        .attr('class', 'building-legend')
        .attr('transform', `translate(${buildingLegendX}, ${buildingLegendY})`);

      // Legend background
      buildingLegendGroup.append('rect')
        .attr('x', -10)
        .attr('y', -25)
        .attr('width', 120)
        .attr('height', buildingTypes.length * 25 + 35)
        .attr('fill', 'white')
        .attr('opacity', 0.9)
        .attr('rx', 4)
        .attr('stroke', hoverColor)
        .attr('stroke-width', 1);

      // Legend title
      buildingLegendGroup.append('text')
        .attr('x', 0)
        .attr('y', -8)
        .attr('font-size', '12px')
        .attr('font-weight', '600')
        .attr('fill', 'currentColor')
        .text('Buildings');

      // Building type entries
      buildingTypes.forEach((building, index) => {
        const entryY = index * 25;
        const entry = buildingLegendGroup.append('g')
          .attr('transform', `translate(0, ${entryY})`);

        // Color square
        entry.append('rect')
          .attr('x', 0)
          .attr('y', 5)
          .attr('width', 15)
          .attr('height', 15)
          .attr('fill', building.color)
          .attr('opacity', 0.8)
          .attr('stroke', building.color)
          .attr('stroke-width', 1)
          .attr('rx', 2);

        // Label
        entry.append('text')
          .attr('x', 22)
          .attr('y', 17)
          .attr('font-size', '11px')
          .attr('fill', 'currentColor')
          .text(building.type);
      });
    }
  }, [data, cellSize, selectedCell, maxCount, groupMaxCounts, onCellClick, colorScheme, selectedInterestGroups, buildingData, showBuildings, useGroupColors]);

  return (
    <div className="relative w-full bg-card rounded-lg border border-border overflow-hidden shadow-lg">
      <svg
        ref={svgRef}
        width={MAP_CONFIG.visual.width}
        height={MAP_CONFIG.visual.height}
        className="w-full h-auto"
      />
      {tooltip && (
        <div
          className="absolute pointer-events-none bg-popover text-popover-foreground text-xs px-3 py-2 rounded-lg shadow-lg border border-border whitespace-pre-line"
          style={{
            left: tooltip.x + 10,
            top: tooltip.y + 10,
          }}
        >
          {tooltip.content}
        </div>
      )}
    </div>
  );
}
