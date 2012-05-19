define(function() {
  var Dialog = Backbone.View.extend({
    initialize : function(options) {
      $(document.body).append(this.$el);

      this.events = options.events;

      this.dialog = $(options.template);
      this.$el.append(this.dialog);
      this.dialog.modal({
        show     : false,
        keyboard : false
      });
      this.dialog.hide();
    },

    show : function() {
      this.dialog.modal('show');
    },

    hide : function() {
      this.dialog.modal('hide');
    }
  });

  return Dialog;
});
