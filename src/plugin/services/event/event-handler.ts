import {EventProxy} from '../../../common/EventProxy';

class UIEventProxy extends EventProxy {
    name: string = 'pluginToUI';
    _sendEvent(event: MessageEvent): void {
        figma.ui.postMessage(event);
    }
}

export const uiEvent = new UIEventProxy();

figma.ui.on('message', event => {
    uiEvent._handleEvent(event)
});