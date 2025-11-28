import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { FlowNode, FlowLink } from '../../types/flow.types';
import { FLOW_CONFIG } from '../../config/flow.config';
import { MAP_CONFIG } from '../../config/map.config';
import BaseMapImage from '@/assets/BaseMap.png';

interface FlowDiagramProps {
  nodes: FlowNode[];
  links: FlowLink[];
  selectedNode?: FlowNode | null;
  onNodeClick?: (node: FlowNode) => void;
  onLinkClick?: (link: FlowLink) => void;
}

export function FlowDiagram({
  nodes,
  links,
  selectedNode,
  onNodeClick,
  onLinkClick,
}: FlowDiagramProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();

    // Use MAP_CONFIG dimensions to match heatmap exactly
    const { width, height, padding } = MAP_CONFIG.visual;
    const { bounds } = MAP_CONFIG;

    // Create SVG with same dimensions as heatmap
    const svg = d3
      .select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    const g = svg.append('g');

    // Create coordinate scales with padding (same as heatmap)
    const xScale = d3
      .scaleLinear()
      .domain([bounds.minLongitude, bounds.maxLongitude])
      .range([padding.left, width - padding.right]);

    const yScale = d3
      .scaleLinear()
      .domain([bounds.maxLatitude, bounds.minLatitude])
      .range([padding.top, height - padding.bottom]);

    // Add background map image (same as heatmap)
    g.append('image')
      .attr('href', BaseMapImage)
      .attr('x', padding.left)
      .attr('y', padding.top)
      .attr('width', width - padding.left - padding.right)
      .attr('height', height - padding.top - padding.bottom)
      .attr('opacity', MAP_CONFIG.image.opacity)
      .attr('preserveAspectRatio', 'none');

    // Calculate node sizes based on total flow (inbound + outbound)
    const maxTotalFlow = d3.max(nodes, (d) => d.total_inbound + d.total_outbound) || 1;
    const nodeRadiusScale = d3
      .scaleSqrt()
      .domain([0, maxTotalFlow])
      .range([FLOW_CONFIG.visual.node.minRadius, FLOW_CONFIG.visual.node.maxRadius]);

    // Calculate link widths based on trip count
    const maxLinkValue = d3.max(links, (d) => d.value) || 1;
    const linkWidthScale = d3
      .scaleLinear()
      .domain([0, maxLinkValue])
      .range([FLOW_CONFIG.visual.link.minWidth, FLOW_CONFIG.visual.link.maxWidth]);

    // Create arrow marker for directed links
    const defs = svg.append('defs');
    defs
      .append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 8)
      .attr('refY', 0)
      .attr('markerWidth', FLOW_CONFIG.visual.arrow.size)
      .attr('markerHeight', FLOW_CONFIG.visual.arrow.size)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', FLOW_CONFIG.visual.link.color)
      .attr('opacity', FLOW_CONFIG.visual.arrow.opacity);

    // Create a map for quick node lookup
    const nodeMap = new Map(nodes.map((d) => [d.id, d]));

    // Create tooltip
    const tooltip = d3
      .select('body')
      .append('div')
      .attr('class', 'flow-tooltip')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background-color', FLOW_CONFIG.visual.tooltip.backgroundColor)
      .style('color', FLOW_CONFIG.visual.tooltip.textColor)
      .style('padding', FLOW_CONFIG.visual.tooltip.padding)
      .style('border-radius', FLOW_CONFIG.visual.tooltip.borderRadius)
      .style('font-size', FLOW_CONFIG.visual.tooltip.fontSize)
      .style('max-width', FLOW_CONFIG.visual.tooltip.maxWidth)
      .style('box-shadow', FLOW_CONFIG.visual.tooltip.boxShadow)
      .style('pointer-events', 'none')
      .style('z-index', '1000');

    // Draw links (flows)
    const linkGroup = g.append('g').attr('class', 'links');

    const linkElements = linkGroup
      .selectAll('path')
      .data(links)
      .join('path')
      .attr('d', (d) => {
        const source = nodeMap.get(d.source);
        const target = nodeMap.get(d.target);
        if (!source || !target) return '';

        const x1 = xScale(source.longitude);
        const y1 = yScale(source.latitude);
        const x2 = xScale(target.longitude);
        const y2 = yScale(target.latitude);

        // Create a curved path using quadratic bezier for better visibility
        const dx = x2 - x1;
        const dy = y2 - y1;
        const dr = Math.sqrt(dx * dx + dy * dy);

        // Control point for curve (perpendicular offset)
        const offset = dr * FLOW_CONFIG.visual.link.curveOffset;
        const cx = (x1 + x2) / 2 - (dy / dr) * offset;
        const cy = (y1 + y2) / 2 + (dx / dr) * offset;

        return `M${x1},${y1} Q${cx},${cy} ${x2},${y2}`;
      })
      .attr('stroke', FLOW_CONFIG.visual.link.color)
      .attr('stroke-width', (d) => linkWidthScale(d.value))
      .attr('fill', 'none')
      .attr('opacity', FLOW_CONFIG.visual.link.opacity)
      .attr('marker-end', 'url(#arrow)')
      .style('cursor', 'pointer')
      .on('mouseover', function (event, d) {
        d3.select(this)
          .attr('opacity', FLOW_CONFIG.visual.link.hoverOpacity)
          .attr('stroke-width', linkWidthScale(d.value) * 1.5);

        const source = nodeMap.get(d.source);
        const target = nodeMap.get(d.target);

        tooltip
          .style('visibility', 'visible')
          .html(
            `
            <strong>Flow</strong><br/>
            From: (${source?.grid_x}, ${source?.grid_y})<br/>
            To: (${target?.grid_x}, ${target?.grid_y})<br/>
            Trips: ${d.value.toLocaleString()}<br/>
            ${d.avg_duration_minutes ? `Avg Duration: ${d.avg_duration_minutes.toFixed(1)} min` : ''}
          `
          );
      })
      .on('mousemove', function (event) {
        tooltip
          .style('top', event.pageY - 10 + 'px')
          .style('left', event.pageX + 10 + 'px');
      })
      .on('mouseout', function (event, d) {
        d3.select(this)
          .attr('opacity', FLOW_CONFIG.visual.link.opacity)
          .attr('stroke-width', linkWidthScale(d.value));
        tooltip.style('visibility', 'hidden');
      })
      .on('click', function (event, d) {
        event.stopPropagation();
        if (onLinkClick) onLinkClick(d);
      });

    // Draw nodes (locations)
    const nodeGroup = g.append('g').attr('class', 'nodes');

    const nodeElements = nodeGroup
      .selectAll('circle')
      .data(nodes)
      .join('circle')
      .attr('cx', (d) => xScale(d.longitude))
      .attr('cy', (d) => yScale(d.latitude))
      .attr('r', (d) => nodeRadiusScale(d.total_inbound + d.total_outbound))
      .attr('fill', FLOW_CONFIG.visual.node.fillColor)
      .attr('stroke', FLOW_CONFIG.visual.node.strokeColor)
      .attr('stroke-width', FLOW_CONFIG.visual.node.strokeWidth)
      .attr('opacity', FLOW_CONFIG.visual.node.opacity)
      .style('cursor', 'pointer')
      .on('mouseover', function (event, d) {
        d3.select(this)
          .attr('opacity', FLOW_CONFIG.visual.node.hoverOpacity)
          .attr('r', nodeRadiusScale(d.total_inbound + d.total_outbound) * 1.2);

        // Highlight connected links
        linkElements
          .attr('opacity', (link) =>
            link.source === d.id || link.target === d.id
              ? FLOW_CONFIG.visual.link.hoverOpacity
              : FLOW_CONFIG.visual.link.opacity * 0.2
          )
          .attr('stroke-width', (link) =>
            link.source === d.id || link.target === d.id
              ? linkWidthScale(link.value) * 1.5
              : linkWidthScale(link.value)
          );

        tooltip
          .style('visibility', 'visible')
          .html(
            `
            <strong>Location (${d.grid_x}, ${d.grid_y})</strong><br/>
            Outbound Trips: ${d.total_outbound.toLocaleString()}<br/>
            Inbound Trips: ${d.total_inbound.toLocaleString()}<br/>
            Total: ${(d.total_outbound + d.total_inbound).toLocaleString()}
          `
          );
      })
      .on('mousemove', function (event) {
        tooltip
          .style('top', event.pageY - 10 + 'px')
          .style('left', event.pageX + 10 + 'px');
      })
      .on('mouseout', function (event, d) {
        d3.select(this)
          .attr('opacity', FLOW_CONFIG.visual.node.opacity)
          .attr('r', nodeRadiusScale(d.total_inbound + d.total_outbound));

        // Reset link opacity and width
        linkElements
          .attr('opacity', FLOW_CONFIG.visual.link.opacity)
          .attr('stroke-width', (link) => linkWidthScale(link.value));

        tooltip.style('visibility', 'hidden');
      })
      .on('click', function (event, d) {
        event.stopPropagation();
        if (onNodeClick) onNodeClick(d);
      });

    // Apply selection highlighting if a node is selected (matches hover behavior)
    if (selectedNode) {
      const selectedId = selectedNode.id;

      // Highlight selected node (same as hover)
      nodeElements
        .attr('opacity', (d) => (d.id === selectedId ? FLOW_CONFIG.visual.node.hoverOpacity : FLOW_CONFIG.visual.node.opacity))
        .attr('r', (d) =>
          d.id === selectedId
            ? nodeRadiusScale(d.total_inbound + d.total_outbound) * 1.2
            : nodeRadiusScale(d.total_inbound + d.total_outbound)
        );

      // Highlight connected links (same as hover)
      linkElements
        .attr('opacity', (link) =>
          link.source === selectedId || link.target === selectedId
            ? FLOW_CONFIG.visual.link.hoverOpacity
            : FLOW_CONFIG.visual.link.opacity * 0.2
        )
        .attr('stroke-width', (link) =>
          link.source === selectedId || link.target === selectedId
            ? linkWidthScale(link.value) * 1.5
            : linkWidthScale(link.value)
        );
    }

    // Cleanup tooltip on unmount
    return () => {
      tooltip.remove();
    };
  }, [nodes, links, selectedNode, onNodeClick, onLinkClick]);

  return <svg ref={svgRef} className="w-full h-auto" />;
}
