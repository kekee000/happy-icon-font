import {createStore} from 'jotai';
import {PageRole} from 'ui/types/app';
import {appStateAtom} from './models/app';

export const store = createStore();

export function setInited(inited: {initCommand: {command: string};}) {
    store.set(appStateAtom, old => {
        return {
            ...old,
            initCommand: inited.initCommand,
        };
    });
}


export function setCurrentPage(page: PageRole) {
    store.set(appStateAtom, old => {
        return {
            ...old,
            currentPage: page,
        };
    });
}

export function setSelectedLayerSnapshot(data: string[]) {
    store.set(appStateAtom, old => {
        return {
            ...old,
            selectedLayerSnapshots: data
        };
    });
}

export function selectedLayerIds(ids: string[]) {
    store.set(appStateAtom, old => {
        return {
            ...old,
            selectedLayerIds: ids
        };
    });
}
