_.templateSettings = {
  "escape"      : /\{\{(.+?)\}\}/g,
  "interpolate" : /\{\{\{(.+?)\}\}\}/g,
  "evaluate"    : /\{\{\!(.+?)\}\}/g
};

Backbone.View.prototype.close = function() {
  this.remove();
  this.unbind();
  if (this.onClose) this.onClose();
};

Backbone.Model.prototype.one = function(e, method) {
  var self = this;
  var wrappedCallback = function() {
    self.off(e, wrappedCallback);
    method.apply(window, arguments);
  };

  this.on(e, wrappedCallback);
};
