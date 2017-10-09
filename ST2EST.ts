"use strict";

interface EventTarget {
    attachEvent?(eventNameWithOn: string, callback: EventListener): boolean;
}

module ST2EST {
    let onEvent: (source: EventTarget, eventName: string, listener: EventListener) => void;
    let onLoaded: (listener: EventListener) => void;
    
    export function initialize(): void {
        initEventHandling();
        onLoaded(isLoaded);
    }

    function initEventHandling(): void {
        if (window.addEventListener || window.attachEvent) {
            if (window.addEventListener) {
                onEvent = function (obj: EventTarget, evt: string, func: EventListener): void {
                    obj.addEventListener(evt, func);
                };
            } else {
                onEvent = function (obj: EventTarget, evt: string, func: EventListener): void {
                    if (obj.attachEvent) {
                        obj.attachEvent('on' + evt, func);
                    }
                };
            }
            onLoaded = function (func: EventListener): void {
                onEvent(document, 'DOMContentLoaded', func);
            };
        } else {
            // the dirty solution
            onEvent = function (obj: EventTarget, evt: string, func: EventListener): void {
                let cur: () => void | null | undefined = obj[evt];
                (function (objCap: EventTarget, evtCap: string, funcCap: EventListener, curCap: () => void | null | undefined) {
                    objCap[evtCap] = function (): void { funcCap(new Event(evtCap)); if (curCap) { curCap(); } };
                })(obj, 'on' + evt, func, cur);
            };
            onLoaded = function (func: EventListener) {
                onEvent(window, 'load', func);
            };
        }
    }

    function isLoaded(): void {
        let st2estButton = <HTMLInputElement | null>document.getElementById('button-st2est');
        let est2stButton = <HTMLInputElement | null>document.getElementById('button-est2st');

        if (st2estButton) {
            onEvent(st2estButton, 'click', st2estClicked);
        }
        if (est2stButton) {
            onEvent(est2stButton, 'click', est2stClicked);
        }
    }

    function st2estClicked(): void {
        let estElem = <HTMLInputElement>document.getElementById('input-express-service-tag');

        let st: string = (<HTMLInputElement>document.getElementById('input-service-tag')).value;
        let est: string;
        try {
            est = ServiceTag.serviceTagToExpressServiceTag(st);
        } catch (e) {
            estElem.value = `Error: ${(<Error>e).message}`;
            return;
        }

        let spaced: string | null = intercalate(est, ' ', 3);
        let finalEst: string = spaced ? spaced : est;
        estElem.value = finalEst;
    }

    function est2stClicked(): void {
        let stElem = <HTMLInputElement>document.getElementById('input-service-tag');
        let est: string = (<HTMLInputElement>document.getElementById('input-express-service-tag')).value;
        let st: string;
        try {
            st = ServiceTag.expressServiceTagToServiceTag(est);
        } catch (e) {
            stElem.value = `Error: ${(<Error>e).message}`;
            return;
        }
        stElem.value = st;
    }

    function intercalate(s: string, delimiter: string, each: number): string | null {
        if (each < 1) {
            return null;
        }

        // warning: breaks beyond the BMP
        let ret: string = '';
        for (let i: number = 0; i < s.length; ++i) {
            ret += s[i];
            if ((i % each) == (each - 1) && (i != s.length - 1)) {
                ret += delimiter;
            }
        }

        return ret;
    }
}
