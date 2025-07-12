
export const enum PageRole {
    /** Icon2Font */
    Icon2Font = 'Icon2Font',
    /** Font2Icon */
    Font2Icon = 'Font2Icon',
}

export interface AppState {
    initCommand: {command: string};
    currentPage: PageRole;
    selectedLayerIds?: string[];
    pluginSettings: HappyIconFont.PluginSettings;
}
