
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Automaton } from '../types';
import { Maximize2, Minimize2, RotateCcw, BoxSelect, ZoomIn, ZoomOut } from 'lucide-react';

interface VisualizerProps {
  automaton: Automaton;
  title: string;
}

const Visualizer: React.FC<VisualizerProps> = ({ automaton, title }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // We use a ref to store the zoom behavior so we can call it programmatically
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  const fitToScreen = () => {
    if (!svgRef.current || !gRef.current || !zoomBehaviorRef.current) return;

    const svg = d3.select(svgRef.current);
    const g = d3.select(gRef.current);
    const bounds = (g.node() as SVGGElement).getBBox();
    const parent = (svg.node() as SVGSVGElement).getBoundingClientRect();
    
    const fullWidth = parent.width;
    const fullHeight = parent.height;
    const width = bounds.width;
    const height = bounds.height;
    const midX = bounds.x + width / 2;
    const midY = bounds.y + height / 2;

    if (width === 0 || height === 0) return;

    const padding = 40;
    const scale = 0.85 / Math.max(width / fullWidth, height / fullHeight);
    const translate = [fullWidth / 2 - scale * midX, fullHeight / 2 - scale * midY];

    svg.transition()
      .duration(750)
      .call(zoomBehaviorRef.current.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale));
  };

  useEffect(() => {
    if (!svgRef.current || !automaton.states.length) return;

    const width = 800;
    const height = isFullscreen ? window.innerHeight - 100 : 500;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg.append("g").attr("ref", "graphGroup");
    // @ts-ignore - attaching ref to selection for later use in fitToScreen
    gRef.current = g.node();

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 5])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    zoomBehaviorRef.current = zoom;
    svg.call(zoom);

    // Unique ID for arrowhead to prevent collisions between multiple visualizers
    const markerId = `arrowhead-${title.replace(/\s+/g, '-')}-${Math.random().toString(36).substr(2, 5)}`;
    
    svg.append("defs").append("marker")
      .attr("id", markerId)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 26) // Position at the edge of the node circle
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#94a3b8");

    const nodes = automaton.states.map(id => ({ id }));
    const links = automaton.transitions.map(t => ({
      source: t.from,
      target: t.to,
      symbol: t.symbol
    }));

    // Grouping symbols for cleaner display
    const groupedLinks: any[] = [];
    links.forEach(link => {
      const existing = groupedLinks.find(gl => gl.source === link.source && gl.target === link.target);
      if (existing) {
        if (!existing.symbols.includes(link.symbol)) {
          existing.symbols.push(link.symbol);
        }
      } else {
        groupedLinks.push({ ...link, symbols: [link.symbol] });
      }
    });

    const simulation = d3.forceSimulation(nodes as any)
      .force("link", d3.forceLink(groupedLinks).id((d: any) => d.id).distance(180))
      .force("charge", d3.forceManyBody().strength(-1000))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(70));

    const link = g.append("g")
      .selectAll("path")
      .data(groupedLinks)
      .enter().append("path")
      .attr("fill", "none")
      .attr("stroke", "#cbd5e1")
      .attr("stroke-width", 2)
      .attr("marker-end", `url(#${markerId})`);

    const linkText = g.append("g")
      .selectAll("text")
      .data(groupedLinks)
      .enter().append("text")
      .attr("font-size", "11px")
      .attr("fill", "#64748b")
      .attr("text-anchor", "middle")
      .attr("font-weight", "600")
      .text(d => d.symbols.join(', '));

    const node = g.append("g")
      .selectAll("g")
      .data(nodes)
      .enter().append("g")
      .call(d3.drag<SVGGElement, any>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended) as any);

    // Node body
    node.append("circle")
      .attr("r", 24)
      .attr("fill", d => d.id === automaton.startState ? "#f0fdf4" : "#ffffff")
      .attr("stroke", d => automaton.finalStates.includes(d.id) ? "#16a34a" : "#94a3b8")
      .attr("stroke-width", d => automaton.finalStates.includes(d.id) ? 3 : 2)
      .attr("class", "transition-all duration-300 shadow-md");

    // Double circle for final states
    node.filter(d => automaton.finalStates.includes(d.id))
      .append("circle")
      .attr("r", 19)
      .attr("fill", "none")
      .attr("stroke", "#16a34a")
      .attr("stroke-width", 1);

    // State labels
    node.append("text")
      .attr("dy", 4)
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .attr("font-weight", "700")
      .attr("class", "pointer-events-none fill-slate-800")
      .text(d => {
        const clean = d.id.replace(/[{}]/g, '');
        return clean.length > 8 ? clean.substring(0, 6) + '..' : clean;
      });

    node.append("title").text(d => d.id);

    simulation.on("tick", () => {
      link.attr("d", (d: any) => {
        if (d.source.id === d.target.id) {
            const x = d.source.x;
            const y = d.source.y;
            // Self-loop path
            return `M${x},${y} C${x-45},${y-65} ${x+45},${y-65} ${x},${y}`;
        }
        const dx = d.target.x - d.source.x;
        const dy = d.target.y - d.source.y;
        const dr = Math.sqrt(dx * dx + dy * dy);
        return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
      });

      linkText.attr("transform", (d: any) => {
        if (d.source.id === d.target.id) {
           return `translate(${d.source.x}, ${d.source.y - 70})`;
        }
        const dx = d.target.x - d.source.x;
        const dy = d.target.y - d.source.y;
        const dr = Math.sqrt(dx * dx + dy * dy);
        const mx = (d.source.x + d.target.x) / 2;
        const my = (d.source.y + d.target.y) / 2;
        const ox = -dy * (35 / dr);
        const oy = dx * (35 / dr);
        return `translate(${mx + ox}, ${my + oy})`;
      });

      node.attr("transform", (d: any) => `translate(${d.x}, ${d.y})`);
    });

    // Run simulation long enough to stabilize, then fit
    simulation.on("end", () => {
        fitToScreen();
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    // Initial fit attempt after a short delay
    const timer = setTimeout(fitToScreen, 500);
    return () => clearTimeout(timer);

  }, [automaton, isFullscreen]);

  const zoomIn = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
        d3.select(svgRef.current).transition().call(zoomBehaviorRef.current.scaleBy, 1.3);
    }
  };

  const zoomOut = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
        d3.select(svgRef.current).transition().call(zoomBehaviorRef.current.scaleBy, 1/1.3);
    }
  };

  return (
    <div 
      className={`bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col transition-all duration-300 group ${
        isFullscreen ? 'fixed inset-0 z-[100] rounded-none' : 'h-[500px]'
      }`}
    >
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
        <div>
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">{title}</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Interactive Finite Automaton</p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={zoomIn} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-indigo-600 transition-all border border-transparent hover:border-slate-100" title="Zoom In"><ZoomIn className="w-4 h-4" /></button>
          <button onClick={zoomOut} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-indigo-600 transition-all border border-transparent hover:border-slate-100" title="Zoom Out"><ZoomOut className="w-4 h-4" /></button>
          <button onClick={fitToScreen} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-indigo-600 transition-all border border-transparent hover:border-slate-100" title="Fit to Screen"><BoxSelect className="w-4 h-4" /></button>
          <button onClick={() => { if(zoomBehaviorRef.current && svgRef.current) d3.select(svgRef.current).transition().call(zoomBehaviorRef.current.transform, d3.zoomIdentity); }} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-indigo-600 transition-all border border-transparent hover:border-slate-100" title="Reset View"><RotateCcw className="w-4 h-4" /></button>
          <div className="w-px h-4 bg-slate-200 mx-1"></div>
          <button 
            onClick={() => setIsFullscreen(!isFullscreen)}
            className={`p-2 rounded-xl transition-all border border-transparent ${isFullscreen ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-400 hover:bg-slate-50 hover:border-slate-100'}`}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="flex-1 relative bg-[radial-gradient(#f1f5f9_1.5px,transparent_1.5px)] [background-size:24px_24px] bg-slate-50/30">
        <svg 
          ref={svgRef} 
          className="w-full h-full cursor-grab active:cursor-grabbing outline-none"
        ></svg>
        
        {/* Floating Legend */}
        <div className="absolute bottom-6 left-6 flex flex-col gap-2 p-3 bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-50 border border-green-600 rounded-full"></div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Initial State</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-green-600 rounded-full flex items-center justify-center">
                    <div className="w-1.5 h-1.5 border border-green-600 rounded-full"></div>
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Accept State</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-slate-400 rounded-full"></div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Standard State</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Visualizer;
