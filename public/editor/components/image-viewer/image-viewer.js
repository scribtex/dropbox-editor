define(["lib/path_util"], function(PathUtil) {
  var ImageViewer = Backbone.View.extend({
    render : function() {
      var template = _.template( $("#image-viewer-template").html(), {
        imageSrc : PathUtil.join(editor.get("fileBaseUrl"), this.model.get("path"))
      });
      this.$el.html(template);
    }
  });

  return ImageViewer;
})
