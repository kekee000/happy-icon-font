/**
 * @file plugin api proxy for ui
 */
import {pluginEvent} from './event/event-handler';

const pluginAPI = new Proxy({} as PromisyAPI<HappyIconFont.PluginAPI>, {
    get: (target, command: keyof HappyIconFont.PluginAPI) => {
        return (...args: any[]) => {
            return new Promise((resolve, reject) => {
                pluginEvent.send({
                    type: command as string,
                    data: args
                }, (error, data) => {
                    if (error) {
                        reject(error);
                    }
                    else {
                        resolve(data);
                    }
                });
            });
        };
    }
});

export default pluginAPI;