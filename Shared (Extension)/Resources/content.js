function getActiveTab() {
    return browser.tabs.query({active: true, currentWindow: true});
}

function getUniqueSelector(elSrc, excludedClasses) {
  if (!(elSrc instanceof Element)) return;
  var sSel,
    aAttr = ['name', 'value', 'title', 'placeholder', 'data-*'], // Common attributes
    aSel = [],
    // Derive selector from element
    getSelector = function(el) {
      // 1. Check ID first
      // NOTE: ID must be unique amongst all IDs in an HTML5 document.
      // https://www.w3.org/TR/html5/dom.html#the-id-attribute
      if (el.id) {
        aSel.unshift('#' + el.id);
        return true;
      }
      aSel.unshift(sSel = el.nodeName.toLowerCase());
      // 2. Try to select by classes
      if (el.className && excludedClasses.includes(el.className) == false) {
        aSel[0] = sSel += '.' + el.className.trim().replace(/ +/g, '.');
          
        if (uniqueQuery()) return true;
      }
      // 3. Try to select by classes + attributes
      for (var i=0; i<aAttr.length; ++i) {
        if (aAttr[i]==='data-*') {
          // Build array of data attributes
          var aDataAttr = [].filter.call(el.attributes, function(attr) {
            return attr.name.indexOf('data-')===0;
          });
          for (var j=0; j<aDataAttr.length; ++j) {
            aSel[0] = sSel += '[' + aDataAttr[j].name + '="' + aDataAttr[j].value + '"]';
            if (uniqueQuery()) return true;
          }
        } else if (el[aAttr[i]]) {
          aSel[0] = sSel += '[' + aAttr[i] + '="' + el[aAttr[i]] + '"]';
          if (uniqueQuery()) return true;
        }
      }
      // 4. Try to select by nth-of-type() as a fallback for generic elements
      var elChild = el,
        sChild,
        n = 1;
      while (elChild = elChild.previousElementSibling) {
        if (elChild.nodeName===el.nodeName) ++n;
      }
      aSel[0] = sSel += ':nth-of-type(' + n + ')';
      if (uniqueQuery()) return true;
      // 5. Try to select by nth-child() as a last resort
      elChild = el;
      n = 1;
      while (elChild = elChild.previousElementSibling) ++n;
      aSel[0] = sSel = sSel.replace(/:nth-of-type\(\d+\)/, n>1 ? ':nth-child(' + n + ')' : ':first-child');
      if (uniqueQuery()) return true;
      return false;
    },
    // Test query to see if it returns one element
    uniqueQuery = function() {
      return document.querySelectorAll(aSel.join('>')||null).length===1;
    };
  // Walk up the DOM tree to compile a unique selector
  while (elSrc.parentNode) {
    if (getSelector(elSrc)) return aSel.join(' > ');
    elSrc = elSrc.parentNode;
  }
}

(function () {
    class ElementPicker {
        constructor(options) {
            // MUST create hover box first before applying options
            this.hoverBox = document.createElement("div");
            this.hoverBox.style.position = "absolute";
            this.hoverBox.style.pointerEvents = "none";

            const defaultOptions = {
                container: document.body,
                selectors: "*", // default to pick all elements
                background: "rgba(153, 235, 255, 0.5)", // transparent light blue
                borderWidth: 5,
                transition: "all 150ms ease", // set to "" (empty string) to disable
                ignoreElements: [document.body],
                action: {},
            }
            const mergedOptions = {
                ...defaultOptions,
                ...options
            };
            Object.keys(mergedOptions).forEach((key) => {
                this[key] = mergedOptions[key];
            });

            this._detectMouseMove = (e) => {
                this._previousEvent = e;
                let target = e.target;
                // console.log("TCL: ElementPicker -> this._moveHoverBox -> target", target)
                if (this.ignoreElements.indexOf(target) === -1 && target.matches(this.selectors) &&
                    this.container.contains(target) ||
                    target === this.hoverBox) { // is NOT ignored elements
                    // console.log("TCL: target", target);
                    if (target === this.hoverBox) {
                        // the truely hovered element behind the added hover box
                        const hoveredElement = document.elementsFromPoint(e.clientX, e.clientY)[1];
                        // console.log("screenX: " + e.screenX);
                        // console.log("screenY: " + e.screenY);
                        // console.log("TCL: hoveredElement", hoveredElement);
                        if (this._previousTarget === hoveredElement) {
                            // avoid repeated calculation and rendering
                            return;
                        } else {
                            target = hoveredElement;
                        }
                    } else {
                        this._previousTarget = target;
                    }
                    const targetOffset = target.getBoundingClientRect();
                    const targetHeight = targetOffset.height;
                    const targetWidth = targetOffset.width;

                    this.hoverBox.style.width = targetWidth + this.borderWidth * 2 + "px";
                    this.hoverBox.style.height = targetHeight + this.borderWidth * 2 + "px";
                    // need scrollX and scrollY to account for scrolling
                    this.hoverBox.style.top = targetOffset.top + window.scrollY - this.borderWidth + "px";
                    this.hoverBox.style.left = targetOffset.left + window.scrollX - this.borderWidth + "px";
                    if (this._triggered && this.action.callback) {
                        this.action.callback(target);
                        this._triggered = false;
                    }
                } else {
                    // console.log("hiding hover box...");
                    this.hoverBox.style.width = 0;
                }
            };
            document.addEventListener("mousemove", this._detectMouseMove);
        }
        get container() {
            return this._container;
        }
        set container(value) {
            if (value instanceof HTMLElement) {
                this._container = value;
                this.container.appendChild(this.hoverBox);
            } else {
                throw new Error("Please specify an HTMLElement as container!");
            }
        }
        get background() {
            return this._background;
        }
        set background(value) {
            this._background = value;

            this.hoverBox.style.background = this.background;
        }
        get transition() {
            return this._transition;
        }
        set transition(value) {
            this._transition = value;

            this.hoverBox.style.transition = this.transition;
        }
        get borderWidth() {
            return this._borderWidth;
        }
        set borderWidth(value) {
            this._borderWidth = value;

            this._redetectMouseMove();
        }
        get selectors() {
            return this._selectors;
        }
        set selectors(value) {
            this._selectors = value;

            this._redetectMouseMove();
        }
        get ignoreElements() {
            return this._ignoreElements;
        }
        set ignoreElements(value) {
            this._ignoreElements = value;

            this._redetectMouseMove();
        }
        get action() {
            return this._action;
        }
        set action(value) {
            if (value instanceof Object) {
                if (typeof value.trigger === "string" &&
                    typeof value.callback === "function") {
                    if (this._triggerListener) {
                        document.removeEventListener(this.action.trigger, this._triggerListener);
                        this._triggered = false;
                    }
                    this._action = value;

                    this._triggerListener = () => {
                        this._triggered = true;
                        this._redetectMouseMove();
                    }
                    document.addEventListener(this.action.trigger, this._triggerListener);
                } else if (value.trigger !== undefined || value.callback !== undefined){ // allow empty action object
                    throw new Error("action must include two keys: trigger (String) and callback (function)!");
                }
            } else {
                throw new Error("action must be an object!");
            }
        }
        close() {
            this.hoverBox.remove()
        }
        _redetectMouseMove() {
            if (this._detectMouseMove && this._previousEvent) {
                this._detectMouseMove(this._previousEvent);
            }
        }
    }
    // export module
    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
        module.exports = ElementPicker;
    } else {
        window.ElementPicker = ElementPicker;
    }
})();

function isMarked(element) {
    if (element.classList == null) { return false }
    return element.classList.contains("broom-marked")
}
function hasMarkedChildren(element) {
    if (element.childNodes == null || element.childNodes.length == 0) { return false }
    const found = Array.from(element.childNodes).find(element => (isMarked(element) || hasMarkedChildren(element)));
    
    return (found != null)
}

function setVisibility(element, visible) {
    if (element.classList == null) { return }
    
    if (visible) {
        element.classList.remove("broom-hidden")
    } else {
        element.classList.add("broom-hidden")
    }
}

function setMarkedChildrenVisibility(element, visible) {
    if (isMarked(element)) {
        setVisibility(element, visible)
    } else if (hasMarkedChildren(element) == true) {
        for (const child of element.childNodes) {
            setMarkedChildrenVisibility(child, visible)
        }
    }
}

function setMarkedElementVisibility(visible) {
    // If there are no marked children, hide/show the whole body
    if (hasMarkedChildren(document.body) == false) {
        setVisibility(document.body, visible)
        return
    } else {
        setVisibility(document.body, true)
    }
        
    setMarkedChildrenVisibility(document.body, visible)
}


function setUnmarkedChildrenVisibility(element, visible) {
    if (hasMarkedChildren(element) == false) {
        setVisibility(element, visible)
    } else {
        for (const child of element.childNodes) {
            setUnmarkedChildrenVisibility(child, visible)
        }
    }
}

function setUnmarkedElementVisibility(visible) {
    setUnmarkedChildrenVisibility(document.body, visible)
}

function setXrayEnabled(enabled) {
    localStorage.setItem('broom-xray-enabled', enabled);
    
    if (enabled) {
        document.body.classList.add("broom-xray")
        picker.selectors = "*";
        setMarkedElementVisibility(true);
    } else {
        document.body.classList.remove("broom-xray")
        picker.selectors = "QWERTYUIOPASDFGHJKLZXCVBNM";
        setMarkedElementVisibility(false);
    }
}

function removeItemOnce(arr, value) {
  var index = arr.indexOf(value);
  if (index > -1) {
    arr.splice(index, 1);
  }
  return arr;
}

function removeItemAll(arr, value) {
  var i = 0;
  while (i < arr.length) {
    if (arr[i] === value) {
      arr.splice(i, 1);
    } else {
      ++i;
    }
  }
  return arr;
}

function markChild(element) {
    const host = "marked_" + window.location.host
    const selector = getUniqueSelector(element, ["broom-marked", "broom-hidden"]);
    
    if (selector.includes("<")) { return }
    
    element.classList.toggle("broom-marked");
    var marks = (JSON.parse(localStorage.getItem(host)) ?? new Array()).filter(function (s) {
        return element.matches(s) == false
    });
        
    if (element.classList.contains("broom-marked")) {
        marks.push(selector)
    }
    
    localStorage.setItem(host, JSON.stringify(marks))
}

function markFromSaved() {
    const host = "marked_" + window.location.host
    var marks = JSON.parse(localStorage.getItem(host)) ?? new Array()
    
    for (const selector of marks) {
        for (var element of document.querySelectorAll(selector)) {
            element.classList.add("broom-marked")
        }
    }
}

var picker = new ElementPicker({
    action: {
        trigger: "click", // click, dblclick, mouseover,
        callback: (function (target) {
            // target.remove();
            markChild(target)
    //                target.classList.toggle("highlight");
        }),
    }
});

function isXrayEnabled() {
    return JSON.parse(localStorage.getItem('broom-xray-enabled')) ?? false;
}

markFromSaved()
setXrayEnabled(false)

setInterval(function () {
    markFromSaved();
    setXrayEnabled(isXrayEnabled());
}, 2000)

// Listener

function clearMarksForCurrentPage() {
    const host = "marked_" + window.location.host
    var marks = (JSON.parse(localStorage.getItem(host)) ?? new Array()).filter(function (s) {
        const matched = document.querySelectorAll(s)
        return (matched.length == 0)
    });
    
    localStorage.setItem(host, JSON.stringify(marks))
}

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.command === "broom-xray-enabled") {
        setXrayEnabled(true);
    } else if (message.command === "broom-xray-disabled") {
        setXrayEnabled(false);
    } else if (message.command === "broom-get-status") {
        sendResponse(JSON.parse(isXrayEnabled()));
    } else if (message.command == "broom-clear-selected") {
        clearMarksForCurrentPage()
    } else if (message.command == "broom-get-marks") {
        const host = "marked_" + window.location.host
        var marks = (JSON.parse(localStorage.getItem(host)) ?? new Array())
        sendResponse(marks)
    }
});

// Stylesheet

var style = document.createElement('link');
style.rel = 'stylesheet';
style.type = 'text/css';
style.href = chrome.extension.getURL('broombase.css');
(document.head||document.documentElement).appendChild(style);
