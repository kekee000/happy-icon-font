import {uiEvent} from './services/event/event-handler';

export default () => {
    let currentSelection: readonly SceneNode[] | undefined;
    const pluginAPI: HappyIconFont.PluginAPI = {
        async selectNodes(ids: string[]) {
            const nodes = await Promise.all(ids.map(id => figma.getNodeByIdAsync(id))) as SceneNode[];
            figma.currentPage.selection = nodes;
            figma.viewport.scrollAndZoomIntoView(nodes);
        },

        getSelection(): string[] {
            if (!currentSelection) {
                return [];
            }
            const serializedNodes = currentSelection as SceneNode[];
            return serializedNodes.map(i => i.id);
        },

        figmaNotify(message: string, options = {}) {
            figma.notify(message, options);
        },

        async getSelectionSnapshots(): Promise<string[]> {
            if (!currentSelection) {
                return [];
            }
            const snapshots = await Promise.all(currentSelection
                .map((node) => node.exportAsync({format: 'SVG'}).then(bytes => String.fromCharCode.apply(null, bytes))));
            return snapshots;
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
