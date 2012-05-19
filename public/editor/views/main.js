define(function() {
  var MainView = Backbone.View.extend({
    render : function() {
      var template = _.template( $("#main-template").html());
      this.$el.append(template);
      return this;
    }
  });

  return MainView;
});
