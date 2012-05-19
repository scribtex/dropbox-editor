define(["components/base", "ace/ace", "ace/mode/latex"], function(Component, Ace, LatexMode) {
  var TextEditorView = Backbone.View.extend({
    initialize : function() {
      this.model.on("change:content", this.updateContent, this);
    },

    onClose : function() {
      this.model.off("change:content", this.updateContent);
    },

    render : function() {
      this.$el.css({
        position : "absolute",
        width    : "100%",
        height   : "100%"
      });
      this.editor = Ace.edit(this.el);
      this.editor.getSession().setMode(new LatexMode.Mode());
      this.editor.getSession().setUseWrapMode(true);
      this.editor.setShowPrintMargin(false);
      this.editor.getSession().setValue(this.model.get("content"));
      return this;
    },

    updateContent : function() {
      if (this.editor) {
        this.editor.getSession().setValue(this.model.get("content"))
      }
    },

    transferContentToModel : function() {
      this.model.set("content", this.editor.getSession().getValue());
    }
  })

  return TextEditorView;
});

