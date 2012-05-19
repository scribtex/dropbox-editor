define(function() {
  var PdfWindowView = Backbone.View.extend({
    initialize : function(options) {
      this.pdfUrl = encodeURI(options.pdfUrl);
      var self = this;
      $(window).on("resize", function() { self.resize() });
    },

    render : function() {
      var template = _.template( $("#pdf-tabs-template").text(), {
        pdfSrc : this.pdfUrl
      });
      this.$el.html(template);
      this.resize();
      return this;
    },

    resize : function() {
      this.$el.find("embed").height( $(window).innerHeight() - $(".full-page-pdf-tabs").outerHeight() );
    },

    updatePdf : function(pdfUrl) {
      this.$el.find("embed").attr({
        src : pdfUrl
      }).hide().show();
    }
  });

  return PdfWindowView;
});
