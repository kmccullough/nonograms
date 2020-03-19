(function() { 'use strict';

  const fnLib = {
    /**
     * Whether given value is a function
     * @param {function|*} fn Value to test
     * @return {boolean}
     */
    is(fn) {
      return typeof fn === 'function';
    },
    /**
     * Gives function which returns given function result or undefined
     * @param {function|*} fn Function to call, if it is a function
     * @param {object|null|*} [self] Context for given function call
     * @param {...*} [args] Arguments to pass to given function
     * @return {function} Wrapped function
     */
    wrap(fn, self, args) {
      return fnLib.is(fn) ? fn.bind(self, ...args) : () => {};
    },
    /**
     * Call given function with args
     * @param {Function|undefined} fn
     * @param {...*} [args]
     * @return {*|void}
     */
    call: (fn, ...args) => {
      return fnLib.is(fn) ? fn.call(this, ...args) : undefined;
    }
  };

  const domLib = {
    /**
     * Whether given value is a DOM Element
     * @param {Element|*} el Value to test
     * @return {boolean}
     */
    is(el) {
      return el instanceof Element || el instanceof HTMLDocument;
    },
    /**
     * Get one matching element from the DOM
     * @param {string} selector DOM query selector
     * @param {Element} [el] Element to search from
     * @return {Element}
     */
    one(selector, el) {
      return !selector ? null : domLib.is(selector) ? selector
        : (el || document).querySelector(selector);
    },
    /**
     * Get all matching element from the DOM
     * @param {string} selector DOM query selector
     * @param {Element} [el] Element to search from
     * @return {NodeListOf<Element>}
     */
    all(selector, el) {
      return (el || document).querySelectorAll(selector);
    },
    /**
     * Remove given element(s) from their parents
     * @param {Element|string|Array.<Element|string>} els Elements/selectors to remove
     * @return {Element|Element[]} Removed elements
     */
    remove(els) {
      if (!els) {
        return;
      }
      const result = [];
      [].concat(els).forEach(el => {
        if (typeof el === 'string') {
          domLib.all(el).forEach(el => {
            el.remove();
            result.push(el);
          });
        } else if (domLib.is(el)) {
          el.remove();
          result.push(el);
        }
      });
      return result;
    },
    /**
     * Remove all children from given element(s)
     * @param {Element|string|Array.<Element|string>} els Elements/selectors to clear children from
     * @return {Element[]|Element[][]} Removed elements
     */
    clear(els) {
      if (!els) {
        return [];
      }
      const isSingle = !Array.isArray(els);
      const removed = [].concat(els).map(el => {
        const removedNodes = [];
        if (typeof el === 'string' || domLib.is(el)) {
          (typeof el === 'string' ? domLib.all(el) : [el]).forEach(e => {
            while (e.firstChild) {
              removedNodes.push(e.removeChild(e.firstChild));
            }
          });
        }
        return removedNodes;
      });
      return isSingle ? removed[0] : removed;
    },
    /**
     * Set given element's children to given child elements
     * @param {Element} el Element to append children to
     * @param {Element|string} el Element/selector to set children of
     * @param {Element|Element[]} [childEls] Elements to append as children
     */
    setChildren(el, childEls) {
      el = domLib.one(el);
      if (domLib.is(el)) {
        domLib.clear(el);
        if (childEls) {
          domLib.appendTo(el, [].concat(childEls));
        }
      }
    },
    /**
     * Append to given element's children given child elements
     * @param {Element|string} el Element/selector to append children to
     * @param {Element|Element[]} [childEls] Elements to append as children
     */
    appendTo(el, childEls) {
      el = domLib.one(el);
      if (domLib.is(el) && childEls) {
        [].concat(childEls).forEach(childEl =>
          domLib.is(childEl) && el.appendChild(childEl)
        );
      }
    },
    /**
     * Create element with given tag name
     * @param {string|Element} tagName Tag name of new element
     * @param {{attrs?:{},appendTo?:(Element|string)?,onLoad?:Function}} [options]
     * @return {Element}
     */
    create(tagName, options) {
      let {
        attrs, attributes,
        appendTo, parent,
        content,
        children,
        onLoad,
        ...opts
      } = options || {};
      const el = domLib.is(tagName) ? tagName :
        document.createElement(tagName, opts);
      if (el) {
        if (el instanceof Image) {
          imgLib.onLoad(el, onLoad);
        } else {
          domLib.onEvent(el, 'load', onLoad);
        }
        domLib.attrs(el, attrs || attributes || {});
        el.textContent = content;
        if (children) {
          domLib.appendTo(el, [].concat(children));
        }
        domLib.appendTo(appendTo || parent, el);
      }
      return el;
    },
    /**
     * Get/set attribute on given element
     * @param {Element} el Element for which to get/set attribute
     * @param {string} attr Attribute to get/set
     * @param {*} [value] Attribute value to set
     * @return {Element|*} Attribute value on get; Element on set
     */
    attr(el, attr, value) {
      if (arguments.length < 3) {
        return el && el.getAttribute(attr);
      }
      if (el) {
        el.setAttribute(attr, value);
      }
      return el;
    },
    /**
     * Get/set attributes on given element
     * @param {Element} el Element for which to get/set attributes
     * @param {[]|{}} [attrs] Attributes to get/set
     * @return {Element|{}} Attribute values on get; Element on set
     */
    attrs(el, attrs) {
      const all = !attrs;
      if (all || Array.isArray(attrs)) {
        const result = {};
        if (el) {
          const names = all ? el.getAttributeNames() : attrs;
          for (let name of names) {
            result[name] = el.getAttribute(name);
          }
        }
        return result;
      }
      if (el) {
        Object.entries(attrs).forEach(([ key, value ]) => {
          if (key === 'style' && lib.obj.isObj(value)) {
            Object.assign(el.style, value);
          } else {
            el.setAttribute(key, value);
          }
        });
      }
      return el;
    },
    style(el, style) {
      if (!el) {
        el = document.body;
      } else if (style) {
        Object.assign(el.style, style);
      }
      return getComputedStyle(el);
    },
    cssVar(varName, style) {
      if (!varName) {
        return;
      }
      style = style || domLib.style();
      const varVals = [].concat(varName)
        .map(name => style.getPropertyValue('--' + name));
      return Array.isArray(varName) ? varVals : varVals[0];
    },
    /**
     * Whether given Element emits events
     * @param {EventTarget|*} el Value to test
     * @return {boolean}
     */
    isEventTarget(el) {
      return el instanceof EventTarget;
    },
    /**
     * Calls given callback when given element emits given event
     * @param {Element} el
     * @param {string} event
     * @param {Function} callback
     * @return {Function} Call to unsubscribe
     */
    onEvent(el, event, callback) {
      let unsubscribe;
      if (event && domLib.isEventTarget(el) && fnLib.is(callback)) {
        el.addEventListener(event, callback);
        unsubscribe = () => el.removeEventListener(event, callback);
      } else {
        unsubscribe = () => {};
      }
      return unsubscribe;
    },
    /**
     * Calls given callback when given element emits given event, then unsubscribes
     * @param {Element} el
     * @param {string} event
     * @param {Function} callback
     * @return {Function} Call to unsubscribe
     */
    oneEvent(el, event, callback) {
      let unsubscribe;
      if (event && domLib.is(el) && fnLib.is(callback)) {
        unsubscribe = domLib.onEvent(el, event, (...args) => {
          unsubscribe();
          callback(...args);
        });
      } else {
        unsubscribe = () => {};
      }
      return unsubscribe;
    },
    /**
     * Calls given callback when given element loads
     * Note: Callback won't fire if element already loaded
     * @param {Element} el
     * @param {Function} callback
     * @return {Function} Call to unsubscribe
     */
    onLoad(el, callback) {
      return domLib.oneEvent(el, 'load', callback);
    },
    /**
     * Run given function after document ready
     * @param {function} callback Callback function
     * @return {Function} Call to remove subscription
     */
    onReady(callback) {
      return domLib.oneEvent(document, 'DOMContentLoaded', callback);
    },
    /**
     * Recursively find element's absolute position on the page
     * @param {Element} el
     * @param {{x:number,y:number}} [pos] Relative position to add
     * @return {{x:number,y:number}|undefined}
     */
    findPos(el, pos) {
      if (el && el.offsetParent) {
        pos = { x: pos && pos.x || 0, y: pos && pos.y || 0 };
        do {
          pos.y += el.offsetTop || 0;
          pos.x += el.offsetLeft || 0;
          el = el.offsetParent;
        } while (el);
      } else {
        pos = undefined;
      }
      return pos;
    },
    getSize(el) {
      return {
        width: el[ el.clientWidth !== undefined ? 'clientWidth' : 'innerWidth' ],
        height: el[ el.clientHeight !== undefined ? 'clientHeight' : 'innerHeight' ],
      };
    },
  };

  const imgLib = {
    /**
     * Load given image(s)
     * @param {string|string[]|Object.<string,string>} imagePaths Paths of images to load
     * @param {Function} [callback] Called when all given images loaded
     * @return {Image|Image[]|undefined} Created IMG element(s)
     */
    load(imagePaths, callback) {
      if (!imagePaths) {
        return;
      }
      const isSingle = typeof imagePaths === 'string';
      const isArray = Array.isArray(imagePaths);
      const isKeyed = !isSingle && !isArray;
      let images;
      if (isKeyed) {
        imagePaths = Object.entries(imagePaths);
        images = {};
      } else {
        imagePaths = [].concat(imagePaths);
        images = [];
      }
      let result, loadOne;
      if (fnLib.is(callback)) {
        // One extra to make sure result gets set before load
        let remaining = imagePaths.length + 1;
        loadOne = () => {
          if (--remaining === 0) {
            callback(result);
          }
        };
      }
      imagePaths.forEach((src, key) => {
        if (Array.isArray(src)) {
          [ key, src ] = src;
        }
        const image = domLib.create(new Image(), {
          attrs: { src },
          onLoad: loadOne
        });
        if (isKeyed) {
          images[key] = image;
        } else {
          images.push(image);
        }
      });
      result = isSingle ? images[0] : images;
      // Now that result is set, call loadOne an extra time
      loadOne && loadOne();
      return result;
    },
    /**
     * Call given callback when given images are loaded
     * @param {Image|Image[]} images
     * @param {Function} callback Called with loaded images
     */
    onLoad(images, callback) {
      if (!images || !fnLib.is(callback)) {
        return;
      }
      images = [].concat(images);
      if (!images.length) {
        return;
      }
      let remaining = images.length;
      let loadOne = () => {
        if (--remaining === 0) {
          callback(images);
        }
      };
      images.forEach(image => {
        if (image instanceof Image) {
          if (image.complete && image.src) {
            loadOne();
          } else {
            // domLib.onEvent(image, 'load', callback);
            image.onload = callback;
          }
        } else {
          loadOne();
        }
      });
    },
  };

  const objLib = {
    is(objOrFn) {
      return objOrFn && (
        typeof objOrFn === 'object'
        || typeof objOrFn === 'function'
      );
    },
    isObj(objOrFnNotArr) {
      return objOrFnNotArr && (
        typeof objOrFnNotArr === 'object' && !Array.isArray(objOrFnNotArr)
        || typeof objOrFnNotArr === 'function'
      );
    },
    assign(...optionalObjs) {
      const [ destination, ...sources ] = optionalObjs;
      return Object.assign(
        objLib.is(destination) ? destination : {},
        ...sources.filter(source => objLib.is(source))
      );
    },
    filter(obj, keys) {
      return keys.reduce((filtered, key) => {
        if (obj.hasOwnProperty(key)) {
          filtered[key] = obj[key];
        }
        return filtered;
      }, {});
    },
    get(obj, path, valueIfNotFound) {
      if (!obj || !path && path !== 0) {
        return;
      }
      const pathKeys = ('' + path).split('.');
      let found = true;
      let i;
      for (i = 0; i < pathKeys.length; ++i) {
        let hasKey = false;
        try { hasKey = pathKeys[i] in obj; } catch (e) {}
        if (hasKey) {
          obj = obj[pathKeys[i]];
        } else {
          found = false;
          break;
        }
      }
      return found ? obj : arguments.length === 3 ? valueIfNotFound : undefined;
    },
    set(obj, path, value, special, valueIfNotFound) {
      if (!obj || !path) {
        return valueIfNotFound;
      }
      const notFound = {};
      const pathKeys = ('' + path).split('.');
      let parentObj = pathKeys.length === 1 ? obj
        : objLib.get(obj, pathKeys.slice(0, -1), notFound);
      if (parentObj === notFound) {
        return valueIfNotFound;
      }
      let gotValue = objLib.get(obj, path, notFound);
      const hasValue = gotValue !== notFound;
      if (!hasValue) {
        gotValue = valueIfNotFound;
      }
      if (special) {
        if (fnLib.is(value)) {
          value = value(gotValue, hasValue, valueIfNotFound);
        } else if (typeof value === 'string') {
          value = objLib.get(obj, value, valueIfNotFound);
        }
      }
      const last = pathKeys.length - 1;
      for (let i = 0; i < pathKeys.length; ++i) {
        if (i === last) {
          obj[pathKeys[i]] = value;
        } else {
          obj = obj[pathKeys[i]];
        }
      }
      return parentObj[ pathKeys[ pathKeys.length - 1 ] ] = value;
    },
    toggle(obj, path, valueIfNotFound) {
      if (arguments.length === 2) {
        valueIfNotFound = true;
      }
      return this.set(
        obj, path, value => !value, true, !valueIfNotFound
      );
    }
  };

  const envLib = {
    isMobile: typeof window.orientation !== 'undefined'
      || navigator.userAgent.indexOf('IEMobile') !== -1,
  };

  window.lib = {
    dom:     domLib,
    fn:      fnLib,
    img:     imgLib,
    obj:     objLib,
    env:     envLib,
  };

})();
