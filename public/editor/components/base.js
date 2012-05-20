define(function() {
  var Component = function() {
    if (this.initialize) {
      this.initialize.apply(this, arguments);
    }
  };

  _.extend(Component.prototype, Backbone.Events)

  Component.extend = Backbone.Model.extend;

  return Component;
});
