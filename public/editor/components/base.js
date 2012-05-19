define(function() {
  var Component = function() {
    if (this.initialize) {
      this.initialize.apply(this, arguments);
    }
  };

  Component.extend = Backbone.Model.extend;

  return Component;
});
