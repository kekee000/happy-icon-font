import getLogger from '../common/logger';
import {uiEvent} from './services/event/event-handler';
const logger = getLogger('plugin');

function sortSelection(selection: SceneNode[]): SceneNode[] {
    return selection.sort((a, b) => {
        // sort by position
        if (a.absoluteBoundingBox.y !== b.absoluteBoundingBox.y) {
            return a.absoluteBoundingBox.y - b.absoluteBoundingBox.y;
        }
        if (a.absoluteBoundingBox.x !== b.absoluteBoundingBox.x) {
            return a.absoluteBoundingBox.x - b.absoluteBoundingBox.x;
        }
        // if position is the same, sort by name
        return a.name.localeCompare(b.name);
    });
}

export default (): void => {
    let currentSelection: readonly SceneNode[] | undefined;
    const pluginAPI: HappyIconFont.PluginAPI = {
        async selectNodes(ids: string[]) {
            const nodes = await Promise.all(ids.map(id => figma.getNodeByIdAsync(id))) as SceneNode[];
            figma.currentPage.selection = nodes;
            figma.viewport.scrollAndZoomIntoView(nodes);
        },

        async getSelectionSVG(): Promise<Array<HappyIconFont.SVGData>> {
            if (!currentSelection) {
                return [];
            }
            const promises: Promise<HappyIconFont.SVGData>[] = [];
            const nodes = sortSelection(Array.from(currentSelection));
            nodes.forEach(node => {
                let name = node.name.trim();
                if (node.parent.type === 'FRAME' || node.parent.type === 'GROUP' || node.parent.type === 'COMPONENT' || node.parent.type === 'INSTANCE') {
                    name = node.parent.name.trim();
                }
                if (/[\w+-]+/.test(name)) {
                    name = [...name.toLowerCase().matchAll(/[\w+-]+/g)].join('-');
                }
                promises.push((('outlineStroke' in node) && node.outlineStroke() || node).exportAsync({format: 'SVG'})
                    .then(bytes => {
                        return {
                            name,
                            id: node.id,
                            svg: String.fromCharCode.apply(null, bytes),
                            width: node.width,
                            height: node.height,
                        }
                    })
                    .catch((e) => {
                        logger.warn('getSelectionSVG error', e);
                        return null;
                    }));
            });
            const results = (await Promise.all(promises)).filter(svg => svg) as HappyIconFont.SVGData[];
            logger.info('getSelectionSVG results', results.length);
            return results;
        },

        figmaNotify(message: string, options: NotificationOptions = {}) {
            figma.notify(message, options);
        },

        async setSettings(settings: HappyIconFont.PluginSettings) {
            try {
                await figma.clientStorage.setAsync('pluginSettings', settings);
            }
            catch (error) {
                console.error('Error saving settings', error);
            }
        },

        async getSettings() {
            try {
                const settings = await figma.clientStorage.getAsync('pluginSettings');
                return settings || null;
            }
            catch (error) {
                console.error('Error getting settings', error);
                return null;
            }
        },

        importSvgToFigma(svg: HappyIconFont.SVGData) {
            const svgNode = figma.createNodeFromSvg(svg.svg);
            if (!svgNode) {
                pluginAPI.figmaNotify(`Failed to create SVG node for ${svg.name}`, {timeout: 2000});
                return;
            }
            let node: SceneNode = null;
            if (svg.name) {
                const frame = figma.createFrame();
                frame.name = svg.name;
                frame.resize(svg.width, svg.height);
                frame.fills = [];
                frame.appendChild(svgNode);
                svgNode.x = (svg.width - svgNode.width) / 2;
                svgNode.y = (svg.height - svgNode.height) / 2;
                node = frame;
            }
            else {
                 svgNode.name = svg.name || '';
                 node = svgNode;
            }
            let shouldScrollIntoView = false;
            if (svg.x !== undefined && svg.y !== undefined) {
                node.x = svg.x;
                node.y = svg.y;
            }
            // insert adjusted position if x and y are not provided
            else if (currentSelection && currentSelection.length > 0) {
                const adjustNode = currentSelection[currentSelection.length - 1];
                node.x = adjustNode.x + adjustNode.width + 20;
                node.y = adjustNode.y;
            }
            else {
                shouldScrollIntoView = true;
            }
            figma.currentPage.appendChild(node);
            figma.currentPage.selection = [node];
            if (shouldScrollIntoView) {
                figma.viewport.scrollAndZoomIntoView([node]);
            }
        },

        openExternal(url: string) {
            figma.openExternal(url);
        },
    };


    uiEvent.registerHandlers(pluginAPI);

    figma.on('selectionchange', async () => {
        currentSelection = figma.currentPage.selection;
        uiEvent.send({
            type: 'selectFigmaLayer',
            data: [{
                ids: currentSelection.map((node) => node.id),
            }]
        });
    });

    figma.on('currentpagechange', () =>{
        uiEvent.send({
            type: 'pageChanged',
        });
    });

    figma.on('run', (args) =>{
        uiEvent.send({
            type: 'init',
            data: [{
                initCommand: args,
            }]
        });

        if (figma.currentPage.selection?.length) {
            currentSelection = figma.currentPage.selection;
            uiEvent.send({
                type: 'selectFigmaLayer',
                data: [{
                    ids: currentSelection.map((node) => node.id),
                }]
            });
        }
    });

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    figma.on('drop', (e: DropEvent) => {
        const svg = e.dropMetadata as HappyIconFont.SVGData;
        svg.x = e.x - svg.width / 2;
        svg.y = e.y - svg.width / 2;
        pluginAPI.importSvgToFigma(svg);
    });
};
