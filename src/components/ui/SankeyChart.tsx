'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { logger } from "../../lib/logger";
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import * as d3 from 'd3';
import { sankey, sankeyLinkHorizontal } from 'd3-sankey';

export interface SankeyNode {
    id: string;
    name: string;
    category?: string;
    value?: number;
    color?: string;
}

export interface SankeyLink {
    source: string;
    target: string;
    value: number;
    color?: string;
}

export interface SankeyData {
    nodes: SankeyNode[];
    links: SankeyLink[];
}

interface SankeyChartProps {
    data: SankeyData;
    title?: string;
    width?: number;
    height?: number;
    nodePadding?: number;
    nodeWidth?: number;
    colors?: string[];
    units?: string;
    onNodeClick?: (node: any) => void;
    onLinkClick?: (link: any) => void;
}

// Type personnalisé pour les nœuds et liens après traitement par d3-sankey
interface ProcessedNode extends SankeyNode {
    index?: number;
    x0?: number;
    x1?: number;
    y0?: number;
    y1?: number;
}

interface ProcessedLink extends Omit<SankeyLink, 'source' | 'target'> {
    source: ProcessedNode;
    target: ProcessedNode;
    width?: number;
    y0?: number;
    y1?: number;
}

const defaultColors = [
    '#4e79a7', '#f28e2c', '#e15759', '#76b7b2', '#59a14f',
    '#edc949', '#af7aa1', '#ff9da7', '#9c755f', '#bab0ab'
];

export function SankeyChart({
    data,
    title = 'Diagramme de Sankey',
    width = 800,
    height = 500,
    nodePadding = 10,
    nodeWidth = 15,
    colors = defaultColors,
    units = 'valeur',
    onNodeClick,
    onLinkClick
}: SankeyChartProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const [processedData, setProcessedData] = useState<{
        nodes: ProcessedNode[];
        links: ProcessedLink[];
    } | null>(null);
    const [hoveredElement, setHoveredElement] = useState<any>(null);
    const [activeLinkType, setActiveLinkType] = useState<string>('value');
    const [tooltipVisible, setTooltipVisible] = useState(false);
    const [tooltipContent, setTooltipContent] = useState('');
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

    // Vérification des données
    const isValidData = useMemo(() => {
        return data &&
            Array.isArray(data.nodes) &&
            Array.isArray(data.links) &&
            data.nodes.length > 0 &&
            data.links.length > 0;
    }, [data]);

    // Traitement des données pour le diagramme Sankey
    useEffect(() => {
        if (!isValidData) {
            setProcessedData(null);
            return;
        }

        // Mapper les nœuds et liens pour le format requis par d3-sankey
        const nodeMap = new Map();
        data.nodes.forEach((node, i) => {
            nodeMap.set(node.id, { ...node, index: i });
        });

        const links = data.links.map(link => {
            const sourceNode = nodeMap.get(link.source);
            const targetNode = nodeMap.get(link.target);

            if (!sourceNode || !targetNode) {
                logger.error(`Lien invalide: source=${link.source}, target=${link.target}`);
                return null;
            }

            return {
                ...link,
                source: sourceNode,
                target: targetNode
            };
        }).filter(Boolean) as ProcessedLink[];

        // Utiliser d3-sankey pour calculer la disposition
        const sankeyLayout = sankey()
            .nodeWidth(nodeWidth)
            .nodePadding(nodePadding)
            .extent([[1, 5], [width - 1, height - 5]]);

        try {
            // Calculer le graphique Sankey
            const graph = sankeyLayout({
                nodes: Array.from(nodeMap.values()),
                links: links
            });

            setProcessedData({
                nodes: graph.nodes as ProcessedNode[],
                links: graph.links as ProcessedLink[]
            });
        } catch (error) {
            logger.error('Erreur lors du calcul du diagramme Sankey:', error);
            setProcessedData(null);
        }
    }, [data, width, height, nodeWidth, nodePadding, isValidData]);

    // Rendu du graphique avec D3
    useEffect(() => {
        if (!processedData || !svgRef.current) return;
        
        // Protection SSR - s'assurer que D3 est disponible
        if (typeof window === 'undefined' || !d3 || !d3.select) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();

        // Créer les groupes principaux
        const linkGroup = svg.append('g').attr('class', 'links');
        const nodeGroup = svg.append('g').attr('class', 'nodes');

        // Fonction pour générer des liens horizontaux
        const linkGenerator = sankeyLinkHorizontal();

        // Associer des couleurs aux catégories de nœuds
        const categorySet = new Set<string>();
        processedData.nodes.forEach(node => {
            if (node.category) categorySet.add(node.category);
        });

        const categoryColors: Record<string, string> = {};
        Array.from(categorySet).forEach((category, i) => {
            categoryColors[category] = colors[i % colors.length];
        });

        // Dessiner les liens - Protection contre les erreurs D3
        const links = linkGroup
            .selectAll('path')
            .data(processedData?.links || [])
            .enter()
            .append('path')
            .attr('d', linkGenerator)
            .attr('fill', 'none')
            .attr('stroke', (d: ProcessedLink) => d.color || '#aaa')
            .attr('stroke-opacity', 0.4)
            .attr('stroke-width', (d: any) => Math.max(1, d.width || 0))
            .style('cursor', 'pointer')
            .on('mouseover', function (event, d) {
                d3.select(this)
                    .attr('stroke-opacity', 0.7)
                    .attr('stroke-width', (d: any) => Math.max(1, (d.width || 0) + 2));

                setHoveredElement(d);
                showTooltip(event, d);
            })
            .on('mousemove', showTooltip)
            .on('mouseout', function () {
                d3.select(this)
                    .attr('stroke-opacity', 0.4)
                    .attr('stroke-width', (d: any) => Math.max(1, d.width || 0));

                setHoveredElement(null);
                setTooltipVisible(false);
            })
            .on('click', (event, d) => {
                if (onLinkClick) onLinkClick(d);
            });

        // Dessiner les nœuds
        const nodes = nodeGroup
            .selectAll('rect')
            .data(processedData.nodes)
            .enter()
            .append('rect')
            .attr('x', (d: ProcessedNode) => d.x0 || 0)
            .attr('y', (d: ProcessedNode) => d.y0 || 0)
            .attr('height', (d: ProcessedNode) => ((d.y1 || 0) - (d.y0 || 0)))
            .attr('width', (d: ProcessedNode) => ((d.x1 || 0) - (d.x0 || 0)))
            .attr('fill', (d: ProcessedNode) => d.color || (d.category ? categoryColors[d.category] : '#999'))
            .attr('stroke', (d: ProcessedNode) => d3.rgb(d.color || (d.category ? categoryColors[d.category] : '#999')).darker(0.5).toString())
            .style('cursor', 'pointer')
            .on('mouseover', function (event, d) {
                d3.select(this).attr('fill', d3.rgb(d.color || (d.category ? categoryColors[d.category] : '#999')).brighter(0.2).toString());
                setHoveredElement(d);
                showTooltip(event, d);
            })
            .on('mousemove', showTooltip)
            .on('mouseout', function (event, d) {
                d3.select(this).attr('fill', d.color || (d.category ? categoryColors[d.category] : '#999'));
                setHoveredElement(null);
                setTooltipVisible(false);
            })
            .on('click', (event, d) => {
                if (onNodeClick) onNodeClick(d);
            });

        // Ajouter des étiquettes aux nœuds
        nodeGroup
            .selectAll('text')
            .data(processedData.nodes)
            .enter()
            .append('text')
            .attr('x', (d: ProcessedNode) => {
                if (!d.x0 || !d.x1) return 0;
                return d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6;
            })
            .attr('y', (d: ProcessedNode) => ((d.y0 || 0) + ((d.y1 || 0) - (d.y0 || 0)) / 2))
            .attr('dy', '0.35em')
            .attr('text-anchor', (d: ProcessedNode) => (d.x0 || 0) < width / 2 ? 'start' : 'end')
            .text((d: ProcessedNode) => d.name)
            .attr('font-size', '10px')
            .attr('fill', '#555')
            .attr('pointer-events', 'none');

        // Fonction pour afficher les infobulles
        function showTooltip(event: any, d: any) {
            if (!d) return;

            const isNode = 'name' in d;
            let content = '';

            if (isNode) {
                // Contenu pour un nœud
                content = `<div><strong>${d.name}</strong></div>`;
                if (d.category) {
                    content += `<div>Catégorie: ${d.category}</div>`;
                }
                if (d.value !== undefined) {
                    content += `<div>Valeur: ${d.value} ${units}</div>`;
                }

                // Calcul des flux entrants et sortants
                if (processedData) {
                    const totalIn = processedData.links
                        .filter(link => link.target.id === d.id)
                        .reduce((sum, link) => sum + link.value, 0);

                    const totalOut = processedData.links
                        .filter(link => link.source.id === d.id)
                        .reduce((sum, link) => sum + link.value, 0);

                    content += `<div>Entrants: ${totalIn} ${units}</div>`;
                    content += `<div>Sortants: ${totalOut} ${units}</div>`;
                }
            } else {
                // Contenu pour un lien
                const sourceNode = d.source;
                const targetNode = d.target;
                content = `<div><strong>${sourceNode.name} → ${targetNode.name}</strong></div>`;

                if (activeLinkType === 'value') {
                    content += `<div>Valeur: ${d.value} ${units}</div>`;
                } else if (activeLinkType === 'percentage') {
                    // Calcul du pourcentage par rapport au total des flux sortants du nœud source
                    if (processedData) {
                        const totalOut = processedData.links
                            .filter(link => link.source.id === sourceNode.id)
                            .reduce((sum, link) => sum + link.value, 0);

                        const percentage = totalOut > 0 ? (d.value / totalOut * 100).toFixed(1) : '0';
                        content += `<div>Pourcentage: ${percentage}%</div>`;
                    } else {
                        content += `<div>Pourcentage: N/A</div>`;
                    }
                }
            }

            setTooltipContent(content);
            setTooltipPosition({
                x: event.pageX,
                y: event.pageY
            });
            setTooltipVisible(true);
        }
    }, [processedData, colors, width, height, onNodeClick, onLinkClick, activeLinkType, units]);

    // Gestion des cas où les données sont invalides
    if (!isValidData) {
        return (
            <Card className="p-4 h-full">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium">{title}</h3>
                </div>
                <div className="flex justify-center items-center h-[400px] text-muted-foreground">
                    {!data ?
                        "Données non valides pour le diagramme de Sankey" :
                        data.nodes.length === 0 || data.links.length === 0 ?
                            "Aucune donnée disponible" :
                            "Erreur lors du chargement des données"
                    }
                </div>
            </Card>
        );
    }

    return (
        <Card className="p-4 h-full">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">{title}</h3>
                <div className="flex items-center gap-2">
                    <Label htmlFor="linkType" className="text-sm">Type de lien:</Label>
                    <Select value={activeLinkType} onValueChange={setActiveLinkType}>
                        <SelectTrigger id="linkType" className="w-32">
                            <SelectValue placeholder="Type de lien" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="value">Valeur</SelectItem>
                            <SelectItem value="percentage">Pourcentage</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="relative" style={{ height, width: '100%', maxWidth: width, margin: '0 auto' }}>
                <svg ref={svgRef} width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMinYMin meet"></svg>

                {tooltipVisible && (
                    <div
                        className="absolute z-50 p-2 bg-white rounded-md shadow-lg border border-gray-200 text-sm"
                        style={{
                            left: tooltipPosition.x + 10,
                            top: tooltipPosition.y - 40,
                            transform: 'translateX(-50%)'
                        }}
                        dangerouslySetInnerHTML={{ __html: tooltipContent }}
                    />
                )}
            </div>

            {hoveredElement && (
                <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                    {hoveredElement.name ? (
                        // Informations sur le nœud
                        <div>
                            <strong>Nœud: {hoveredElement.name}</strong>
                            {hoveredElement.category && <div>Catégorie: {hoveredElement.category}</div>}
                            {hoveredElement.value !== undefined && <div>Valeur: {hoveredElement.value} {units}</div>}
                        </div>
                    ) : (
                        // Informations sur le lien
                        <div>
                            <strong>Lien: {hoveredElement.source.name} → {hoveredElement.target.name}</strong>
                            <div>Valeur: {hoveredElement.value} {units}</div>
                        </div>
                    )}
                </div>
            )}

            <div className="mt-2 text-xs text-muted-foreground">
                <p>Cliquez sur un nœud ou un lien pour plus de détails. Survolez les éléments pour voir leurs informations.</p>
            </div>
        </Card>
    );
}

export default SankeyChart; 