define(function() {
  var MainView = Backbone.View.extend({
    initialize : function() {
      var self = this;
      $(window).on("resize", function() {
        self.resize();
      })
    },

    render : function() {
      var template = _.template( $("#main-template").html());
      this.$el.append(template);
      this.resize();
      return this;
    },

    resize : function() {
      $("#editor").height(
        $(window).innerHeight() - $("#header").outerHeight() - $("#toolbar").outerHeight()
      );
    }
  });

  return MainView;
});
