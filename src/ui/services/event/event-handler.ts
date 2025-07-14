import getLogger from '../../../common/logger';
import {EventMessage, EventProxy} from '../../../common/EventProxy';

class PluginEventProxy extends EventProxy {
    name: string = 'uiToPlugin';
    _sendEvent(event: EventMessage): void {
        window.parent.postMessage({pluginMessage: event}, '*');
    }
}

export const pluginEvent = new PluginEventProxy();

window.onmessage = (event: MessageEvent) => {
    const logger = getLogger('figma-ui: window.onmessage');
    switch (event.origin) {
        case 'https://www.figma.com': {
            pluginEvent._handleEvent(event.data.pluginMessage);
            break;
        }
        default: {
            logger.warn('no matched event.origin');
        }
    }
};