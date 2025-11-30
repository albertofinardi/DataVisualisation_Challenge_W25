import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { MAP_CONFIG } from '@/config/map.config';
import type { BuildingPolygonData, BuildingTypeFilters } from '@/types/buildings.types';
import { getBuildingColor, BUILDING_OPACITY } from '@/config/buildingColors.config';
import BaseMapImage from '@/assets/BaseMap.png';

interface BuildingPolygonsProps {
  data: BuildingPolygonData[];
  typeFilters: BuildingTypeFilters;
  showGrid?: boolean;
  gridSize?: number;
}

export function BuildingPolygons({ data, typeFilters, showGrid = false, gridSize = 8 }: BuildingPolygonsProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; content: string } | null>(null);

  // Detect theme (light/dark mode)
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const updateTheme = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setTheme(isDark ? 'dark' : 'light');
    };

    updateTheme();
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

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

    // Filter data based on type filters
    const filteredData = data.filter((d) => typeFilters[d.building_type]);

    // Create a group for buildings
    const buildingsGroup = g.append('g').attr('class', 'buildings');

    // Draw building polygons
    buildingsGroup
      .selectAll('path.building')
      .data(filteredData)
      .enter()
      .append('path')
      .attr('class', 'building')
      .attr('d', (d) => {
        const points = d.polygon.map(([x, y]) => [xScale(x), yScale(y)] as [number, number]);
        return d3.line()(points) + 'Z'; // Close the path
      })
      .attr('fill', (d) => getBuildingColor(d.building_type, theme))
      .attr('opacity', BUILDING_OPACITY.default)
      .attr('stroke', (d) => getBuildingColor(d.building_type, theme))
      .attr('stroke-width', 1)
      .on('mouseenter', function (event, d) {
        // Highlight on hover
        d3.select(this).attr('opacity', BUILDING_OPACITY.hover).attr('stroke-width', 2);

        // Show tooltip
        const [mouseX, mouseY] = d3.pointer(event, svg.node());
        setTooltip({
          x: mouseX,
          y: mouseY,
          content: d.building_type,
        });
      })
      .on('mouseleave', function () {
        // Reset highlight
        d3.select(this).attr('opacity', BUILDING_OPACITY.default).attr('stroke-width', 1);
        setTooltip(null);
      });

    // Add coordinate grid overlay
    if (showGrid) {
      const gridGroup = g.append('g').attr('class', 'coordinate-grid');

      const gridColor = theme === 'dark' ? '#ffffff' : '#000000';
      const gridOpacity = 0.3;
      const labelOpacity = 0.7;

      // Calculate grid dimensions
      const mapWidth = width - padding.left - padding.right;
      const mapHeight = height - padding.top - padding.bottom;
      const cellWidth = mapWidth / gridSize;
      const cellHeight = mapHeight / gridSize;

      // Generate column labels (A, B, C, ..., up to gridSize)
      const columns = Array.from({ length: gridSize }, (_, i) => String.fromCharCode(65 + i));

      // Draw vertical grid lines
      for (let i = 0; i <= gridSize; i++) {
        const x = padding.left + i * cellWidth;

        // Vertical line
        gridGroup
          .append('line')
          .attr('x1', x)
          .attr('y1', padding.top)
          .attr('x2', x)
          .attr('y2', height - padding.bottom)
          .attr('stroke', gridColor)
          .attr('stroke-width', 2)
          .attr('opacity', gridOpacity)
          .attr('stroke-dasharray', '5,5');

        // Column labels (top)
        if (i < gridSize) {
          gridGroup
            .append('text')
            .attr('x', x + cellWidth / 2)
            .attr('y', padding.top - 10)
            .attr('text-anchor', 'middle')
            .attr('font-size', '18px')
            .attr('font-weight', 'bold')
            .attr('fill', gridColor)
            .attr('opacity', labelOpacity)
            .text(columns[i]);
        }
      }

      // Draw horizontal grid lines
      for (let i = 0; i <= gridSize; i++) {
        const y = padding.top + i * cellHeight;

        // Horizontal line
        gridGroup
          .append('line')
          .attr('x1', padding.left)
          .attr('y1', y)
          .attr('x2', width - padding.right)
          .attr('y2', y)
          .attr('stroke', gridColor)
          .attr('stroke-width', 2)
          .attr('opacity', gridOpacity)
          .attr('stroke-dasharray', '5,5');

        // Row labels (left side)
        if (i < gridSize) {
          gridGroup
            .append('text')
            .attr('x', padding.left - 15)
            .attr('y', y + cellHeight / 2)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .attr('font-size', '18px')
            .attr('font-weight', 'bold')
            .attr('fill', gridColor)
            .attr('opacity', labelOpacity)
            .text((i + 1).toString());
        }
      }
    }
  }, [data, typeFilters, theme, showGrid, gridSize]);

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        width={MAP_CONFIG.visual.width}
        height={MAP_CONFIG.visual.height}
        className="bg-gray-50 dark:bg-gray-900"
      />
      {tooltip && (
        <div
          className="absolute pointer-events-none bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-3 py-2 rounded text-sm shadow-lg z-10"
          style={{
            left: tooltip.x + 10,
            top: tooltip.y - 10,
          }}
        >
          {tooltip.content}
        </div>
      )}
    </div>
  );
}
