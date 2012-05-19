define([
  "components/base",
  "components/file-opener/file-browser-view",
  "components/dialog/dialog",
  "models/directory"
], function(Base, FileBrowserView, Dialog, Directory) {
  var fileOpener = Base.extend({
    initialize : function() {
      this.fileBrowserView = new FileBrowserView({
        model : editor.get("rootDirectory")
      });
      this.fileBrowserView.on("open", function(file) {
        editor.set("openFile", file);
        file.fetch();
        this.getOpenFileDialog().hide();
      }, this);
      this.fileBrowserView.on("change:selection", function(file) {
        if (file) {
          this._enableOpenButton();
        } else {
          this._disableOpenButton();
        }
      }, this);
    },

    showOpenFileDialog : function() {
      this.getOpenFileDialog().show();
    },

    getOpenFileDialog : function() {
      var self = this;
      if (!this.openFileDialog) {
        this.openFileDialog = new Dialog({
          template : $("#open-file-dialog-template").html(),
          events   : {
            "click .cancel-button" : function() {
              self.openFileDialog.hide();
            }
            // We won't enable the open button yet.
          }
        });
        this.openFileDialog.$(".file-browser").append(this.fileBrowserView.render().el);
        this._disableOpenButton();
      }
      return this.openFileDialog;
    },
    
    _disableOpenButton : function() {
      this.getOpenFileDialog().$(".open-button").addClass("disabled");
      this.getOpenFileDialog().$(".open-button").off("click");
    },

    _enableOpenButton : function() {
      this.getOpenFileDialog().$(".open-button").removeClass("disabled");
      var self = this;
      this.getOpenFileDialog().$(".open-button").on("click", function() {
        self.fileBrowserView.openSelected();
      });
    }
  });

  return fileOpener;
});
