import getLogger from '../common/logger';
import {uiEvent} from './services/event/event-handler';
const logger = getLogger('figma-plugin: editor');

export default () => {
    let currentSelection: readonly SceneNode[] | undefined;
    const pluginAPI: HappyIconFont.PluginAPI = {
        async selectNodes(ids: string[]) {
            const nodes = await Promise.all(ids.map(id => figma.getNodeByIdAsync(id))) as SceneNode[];
            figma.currentPage.selection = nodes;
            figma.viewport.scrollAndZoomIntoView(nodes);
        },

        async getSelectionSVG(): Promise<Array<{name: string, svg: string}>> {
            if (!currentSelection) {
                return [];
            }
            const promises: Promise<{name: string, svg: string}>[] = [];
            currentSelection.forEach(node => {
                let name = node.name.trim();
                if (node.parent.type === 'FRAME' || node.parent.type === 'GROUP' || node.parent.type === 'COMPONENT' || node.parent.type === 'INSTANCE') {
                    name = node.parent.name.trim();
                }
                promises.push((('outlineStroke' in node) && node.outlineStroke() || node).exportAsync({format: 'SVG'})
                    .then(bytes => {
                        return {
                            name,
                            svg: String.fromCharCode.apply(null, bytes),
                        }
                    })
                    .catch((e) => {
                        console.error('getSelectionSVG error', e);
                        return {
                            name,
                            svg: '',
                        };
                    }));
            });
            const results = await Promise.all(promises);
            return results;
        },

        figmaNotify(message: string, options = {}) {
            figma.notify(message, options);
        },

        async setSettings(settings: HappyIconFont.PluginSettings) {
            try {
                await figma.clientStorage.setAsync('pluginSettings', settings);
            }
            catch (error) {
                logger.error('Error saving settings', error);
            }
        },

        async getSettings() {
            try {
                const settings = await figma.clientStorage.getAsync('pluginSettings');
                return settings || null;
            }
            catch (error) {
                logger.error('Error getting settings', error);
                return null;
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
};
