define(["lib/path_util"], function(PathUtil) {
  var NewWindowView = Backbone.View.extend({
    initialize : function() {
      this.model.on("change:pdfUrl change:logUrl", this.updatePdfAndLog, this);
    },

    openWindow : function(compileId, pdfExists) {
      var url = PathUtil.join(editor.get("projectBaseUrl"), "compiled");
      url += "?compileId=" + compileId;
      url += "&success=" + pdfExists;
      this.compileWindow = window.open(url, "scribtex-compiled");
    },

    closeWindow : function() {
      if (this.compileWindow) this.compileWindow.close();
    },

    updatePdfAndLog : function() {
      var compileId, pdfExists = false;
      if (this.model.get("pdfUrl") && (m = this.model.get("pdfUrl").match(/([0-9a-f]{32})\/output\.pdf/))) {
        compileId = m[1];
        pdfExists = true;
      } else if (this.model.get("logUrl") && (m = this.model.get("logUrl").match(/([0-9a-f]{32})\/output\.log/))) {
        compileId = m[1];
      }
      if (compileId) {
        this.openWindow(compileId, pdfExists);
      }
    }
  });

  return NewWindowView;
});
