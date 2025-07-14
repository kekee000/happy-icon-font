
export const enum PageRole {
    /** Icon2Font page */
    Icon2Font = 'Icon2Font',
    /** Font2Icon page */
    Font2Icon = 'Font2Icon',
}

export interface AppState {
    initCommand: {command: string};
    currentPage: PageRole;
    selectedLayerIds: string[];
    pluginSettings: HappyIconFont.PluginSettings;
}
