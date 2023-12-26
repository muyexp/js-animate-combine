class Transition {

    constructor() {
        this.transitions = {
            'slide': ['left', 'right', 'top', 'bottom'],
            'fade': ['in', 'out'],
            'zoom': ['in', 'out'],
            'blur': ['in', 'out'],
            'rotate': ['in', 'out'],
        };

        this.$style = document.createElement('style');
        document.body.append(this.$style);

        this.transitionCss = {};
    }

    injectionStyle() {
        return new Promise(resolve => {
            const cssList = Object.values(this.transitionCss);
            this.$style.innerHTML = cssList.join('\n');
            setTimeout(() => {
                resolve();
            });
        });
    }

    formatOptions(opt) {
        for (const key in opt) {
            if (this.transitions[key] && opt[key] === true) {
                opt[key] = this.transitions[key][0];
            }
        }
        return opt;
    }

    getKeyframesName(opt) {
        const keys = Object.keys(opt).sort();
        const p = [];
        for (const i in keys) {
            const key = keys[i];
            if (this.transitions[key] && opt[key]) {
                let v = opt[key];
                p.push(`@${key}=${v}`)
            }
        }

        return 'transition-' + md5(p.join(''));
    }

    async configureTrasition(opt) {
        const keyframesName = this.getKeyframesName(opt);
        if (!this.transitionCss[keyframesName]) {
            let keyframes = null;
            for (const key in opt) {
                if (this.transitions[key] && opt[key]) {
                    keyframes = this.configureKeyframes(keyframes, key, opt[key]);
                }
            }

            this.transitionCss[keyframesName] = this.buildKeyframesCss(keyframesName, keyframes);
            await this.injectionStyle();
        }

        return keyframesName;
    }

    configureKeyframes(keyframes, transition, direction) {
        keyframes = keyframes || {
            start: {
                transform: {},
                filter: {},
            }, end: {
                transform: {},
                filter: {},
            }
        };

        switch (transition) {
            case 'slide':
                keyframes = this.configureSlide(keyframes, direction);
                break;
            case 'zoom':
                keyframes = this.configureZoom(keyframes, direction);
                break;
            case 'fade':
                keyframes = this.configureFade(keyframes, direction);
                break;
            case 'blur':
                keyframes = this.configureBlur(keyframes, direction);
                break;
            case 'rotate':
                keyframes = this.configureRotate(keyframes, direction);
                break;
        }

        return keyframes;
    }

    configureSlide(keyframes, direction) {
        switch (direction) {
            default:
            case 'left':
                keyframes.start.transform['translateX'] = '-100%';
                keyframes.end.transform['translateX'] = '0';
                break;
            case 'top':
                keyframes.start.transform['translateY'] = '-100%';
                keyframes.end.transform['translateY'] = '0';
                break;
            case 'right':
                keyframes.start.transform['translateX'] = '100%';
                keyframes.end.transform['translateX'] = '0';
                break;
            case 'bottom':
                keyframes.start.transform['translateY'] = '100%';
                keyframes.end.transform['translateY'] = '0';
                break;
        }

        return keyframes;
    }

    configureZoom(keyframes, direction) {
        switch (direction) {
            default:
            case 'in':
                keyframes.start.transform['scale'] = '5';
                keyframes.end.transform['scale'] = '1';
                break;
            case 'out':
                keyframes.start.transform['scale'] = '1';
                keyframes.end.transform['scale'] = '5';
                break;
        }

        return keyframes;
    }

    configureFade(keyframes, direction) {
        switch (direction) {
            default:
            case 'in':
                keyframes.start['opacity'] = '0';
                keyframes.end['opacity'] = '1';
                break;
            case 'out':
                keyframes.start['opacity'] = '1';
                keyframes.end['opacity'] = '0';
                break;
        }

        return keyframes;
    }

    configureBlur(keyframes, direction) {
        switch (direction) {
            default:
            case 'in':
                keyframes.start.filter['blur'] = '10px';
                keyframes.end.filter['blur'] = '0';
                break;
            case 'out':
                keyframes.start.filter['blur'] = '0';
                keyframes.end.filter['blur'] = '10px';
                break;
        }
        return keyframes;
    }

    configureRotate(keyframes, direction) {
        switch (direction) {
            default:
            case 'in':
                keyframes.start.transform['rotate'] = '1turn';
                keyframes.end.transform['rotate'] = '0';
                break;
            case 'out':
                keyframes.start.transform['rotate'] = '0';
                keyframes.end.transform['rotate'] = '1turn';
                break;
        }

        return keyframes;
    }

    buildKeyframesCss(className, keyframes) {
        function buildCss(opt) {
            const result = [];
            for (const prop in opt) {
                if (typeof opt[prop] == 'object') {
                    if (Object.keys(opt[prop]).length > 0) {
                        const sub = [];
                        for (const subProp in opt[prop]) {
                            sub.push(`${subProp}(${opt[prop][subProp]})`)
                        }
                        result.push(`${prop}: ${sub.join(' ')};`);
                    }
                } else {
                    result.push(`${prop}: ${opt[prop]};`);
                }
            }
            return result;
        }

        const start = buildCss(keyframes.start);
        const end = buildCss(keyframes.end);

        let css = `@keyframes ${className} {\n`;
        const startCss = "from {\n" + start.join("\n") + "\n}\n";
        const endCss = "to {\n" + end.join("\n") + "\n}\n";
        css += startCss + endCss + "}\n";

        return css;
    }

    /**
     * Represents a book.
     * @constructor
     * @param {Object} opt - 选项
     * @param {string | HTMLElement} opt.$el 动画对象
     * @param {string} opt.duration - 持续时间
     * @param {string} opt.easing - 缓动模式
     * @param {string} opt.fillModel
     * @param {boolean|string} opt.slide - left|right|top|bottom
     * @param {boolean|string} opt.fade - in|out
     * @param {boolean|string} opt.zoom - in|out
     * @param {boolean|string} opt.blur - in|out
     * @param {boolean|string} opt.rotate - in|out
     */
    async start(opt) {
        opt = Object.assign({
            duration: '1s',
            easing: 'ease-out',
            fillModel: 'forwards'
        }, opt);

        this.formatOptions(opt);

        const $el = typeof opt.$el == 'string' ? document.querySelector(opt.$el) : opt.$el;
        const className = await this.configureTrasition(opt);
        $el.style.animation = `${className} ${opt.duration} ${opt.easing} ${opt.fillModel}`;
    }
}