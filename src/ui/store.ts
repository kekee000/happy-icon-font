import {createStore} from 'jotai';
import {PageRole} from 'ui/types/app';
import {appStateAtom} from './models/app';

export const store = createStore();

export function setInited(inited: {initCommand: {command: string};}): void {
    store.set(appStateAtom, old => {
        return {
            ...old,
            initCommand: inited.initCommand,
        };
    });
}


export function setCurrentPage(page: PageRole): void {
    store.set(appStateAtom, old => {
        return {
            ...old,
            currentPage: page,
        };
    });
}

export function setSettings(data: HappyIconFont.PluginSettings): void {
    store.set(appStateAtom, old => {
        return {
            ...old,
            pluginSettings: data
        };
    });
}

export function selectedLayerIds(ids: string[]): void {
    store.set(appStateAtom, old => {
        return {
            ...old,
            selectedLayerIds: ids
        };
    });
}
