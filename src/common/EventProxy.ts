/**
 * figma ui event proxy
 */
import getLogger from './logger';
import {EventEmitter} from 'events';

export interface EventMessage {
    type: string;
    data?: any;
}

export interface InnerEventMessage {
    type: string;
    data?: any[];
    _id: string;
    _cb?: string;
    error?: {message: string, stack: string};
}

interface IEventProxy {
    on(type: string, listener: (data: any) => void): this;
}


let eventId = 0;
export abstract class EventProxy extends EventEmitter implements IEventProxy {
    protected name: string;
    protected callbackMap: Map<string, (error: Error | null, data: any) => any> = new Map();
    protected handlerMap: Map<string, (data: any) => any> = new Map();

    send<T>(message: EventMessage, cb?: (err: Error, data: T) => void) {
        const logger = getLogger(`figma-sendEvent: ${this.name}`);
        const event: InnerEventMessage = {
            type: message.type,
            data: message.data,
            _id: `${this.name}-${message.type}-${eventId++}`,
        };
        if (cb) {
            event._cb = `${this.name}-${event.type}-cb-${eventId++}`;
            this.callbackMap.set(`${event._cb}`, cb);
        }
        logger.debug(event.type, event._id, event._cb);
        this._sendEvent(event);
    }

    abstract _sendEvent(event: EventMessage): void;

    sendCallback(callbackId: string, data: any, error?: Error) {
        const event: InnerEventMessage = {
            type: 'callback',
            _id: `${this.name}-cb-${callbackId}`,
            _cb: callbackId,
            data,
            error: error ? {message: error.message, stack: error.stack} : undefined,
        }
        this._sendEvent(event);
    }

    registerHandlers<T = Record<string, (data: any) => any>>(handlers: T) {
        for (const [name, handler] of Object.entries(handlers)) {
            this.handlerMap.set(`${this.name}-handler-${name}`, handler);
        }
    }

    _handleEvent(event: InnerEventMessage) {
        const logger = getLogger(`figma-handleEvent: ${this.name}`);
        logger.debug(event.type, event._id);
        if (event.type === 'callback' && event._cb) {
            const cb = this.callbackMap.get(event._cb);
            if (typeof cb === 'function') {
                this.callbackMap.delete(event._cb);
                cb(event.error ? new Error(event.error.message) : null, event.data);
            }
        }
        else {
            let handlerName = `${this.name}-handler-${event.type}`;
            if (this.handlerMap.has(handlerName)) {
                const handler = this.handlerMap.get(handlerName);
                logger.debug(`handle event: ${event.type} with handler: ${handlerName}`);
                if (typeof handler === 'function') {
                    let res: any;
                    let err: Error | undefined;
                    try {
                        res = handler.apply(null, event.data || []);
                    }
                    catch (e) {
                        err = e;
                    }
                    if (event._cb) {
                        if (res?.then) {
                            res.then(data => {
                                this.sendCallback(event._cb, data);
                            }, err => {
                                this.sendCallback(event._cb, null, err);
                            });
                        }
                        else {
                            this.sendCallback(event._cb, res, err);
                        }
                    }
                }
            }

            this.emit(event.type, event.data);
        }
    }
}