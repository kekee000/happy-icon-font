
export const enum PageRole {
    /** Icon2Font */
    Icon2Font = 'Icon2Font',
    /** Font2Icon */
    Font2Icon = 'Font2Icon',
}

export interface AppState {
    fileKey: string;
    initCommand: {command: string};
    currentPage: PageRole;
    selectedLayerSnapshots?: string[];
    selectedLayerIds?: string[];
}
