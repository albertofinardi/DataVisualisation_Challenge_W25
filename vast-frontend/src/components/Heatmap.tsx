import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { MAP_CONFIG } from '@/config/map.config';
import type { LocationDataPoint, LocationDetails } from '@/types/heatmap.types';
import { createQuantizeScale, getHoverColor, getSelectedColor } from '@/services/colorScale';
import type { ColorScheme } from '@/services/colorScale';
import BaseMapImage from '@/assets/BaseMap.png';

interface HeatmapProps {
  data: LocationDataPoint[];
  cellSize: number;
  onCellClick?: (details: { grid_x: number; grid_y: number }) => void;
  selectedCell?: LocationDetails | null;
  maxCount?: number;
  colorScheme?: ColorScheme;
}

export function Heatmap({
  data,
  cellSize,
  onCellClick,
  selectedCell,
  maxCount,
  colorScheme = 'coral',
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

    // Create color scale using the color service
    const scaleMaxCount = maxCount ?? (d3.max(data, (d) => parseInt(d.count)) || 1);
    const colorScale = createQuantizeScale([0, scaleMaxCount], colorScheme);

    // Get theme colors
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

    // Create a group for the heatmap with blur filter
    const heatmapGroup = g.append('g')
      .attr('filter', 'url(#heatmap-blur)');

    // Draw heatmap circles (will be blurred for smooth interpolation)
    heatmapGroup.selectAll('circle')
      .data(data.filter((d) => parseInt(d.count) >= MAP_CONFIG.heatmap.minCount))
      .enter()
      .append('circle')
      .attr('cx', (d) => xScale(d.grid_x) + cellPixelWidth / 2)
      .attr('cy', (d) => yScale(d.grid_y + cellSize) + cellPixelHeight / 2)
      .attr('r', Math.max(cellPixelWidth, cellPixelHeight) * 0.8)
      .attr('fill', (d) => colorScale(parseInt(d.count)))
      .attr('opacity', MAP_CONFIG.heatmap.opacity);

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
        setTooltip({
          x: mouseX,
          y: mouseY,
          content: `Count: ${d.count}\nLocation: (${d.center_longitude.toFixed(1)}, ${d.center_latitude.toFixed(1)})`,
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

    // Add color scale legend
    const legendWidth = 200;
    const legendHeight = 20;
    const legendX = width - padding.right - legendWidth - 20;
    const legendY = padding.top + 20;

    // Create gradient for legend (reuse existing defs)
    const gradient = defs.append('linearGradient')
      .attr('id', 'legend-gradient')
      .attr('x1', '0%')
      .attr('x2', '100%');

    // Sample colors from the scale
    const numStops = 10;
    for (let i = 0; i <= numStops; i++) {
      const t = i / numStops;
      const value = scaleMaxCount * t;
      gradient.append('stop')
        .attr('offset', `${t * 100}%`)
        .attr('stop-color', colorScale(value));
    }

    // Legend group
    const legend = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${legendX}, ${legendY})`);

    // Legend rectangle with gradient
    legend.append('rect')
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .style('fill', 'url(#legend-gradient)')
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
      .text(scaleMaxCount.toFixed(0));

    legend.append('text')
      .attr('x', legendWidth / 2)
      .attr('y', legendHeight + 15)
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .attr('fill', 'currentColor')
      .attr('font-weight', '500')
      .text('Count');
  }, [data, cellSize, selectedCell, maxCount, onCellClick, colorScheme]);

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
