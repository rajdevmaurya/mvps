// Workaround shim: request willReadFrequently for 2D canvas contexts
// to reduce Canvas2D getImageData performance warnings.
(function() {
  try {
    const __origGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, attrs) {
      if (type === '2d') {
        try {
          if (!attrs || !Object.prototype.hasOwnProperty.call(attrs, 'willReadFrequently')) {
            const newAttrs = Object.assign({}, attrs, { willReadFrequently: true });
            return __origGetContext.call(this, type, newAttrs);
          }
        } catch (e) {
          // Fall back silently if the environment doesn't support options.
        }
      }
      return __origGetContext.call(this, type, attrs);
    };
  } catch (e) {
    // Ignore shim if environment doesn't expose HTMLCanvasElement
  }
})();
