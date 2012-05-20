define(["components/base", "components/text-editor/text-editor", "models/file"], function(Component, TextEditor, File) {
  var Save = Component.extend({
    initialize : function() {
      this.disableSaving();

      this.templates = {
        saveSuccess : _.template( $("#save-success-template").html() ),
        saveError   : _.template( $("#save-error-template").html() ),
        saving      : _.template( $("#save-saving-template").html() ),
        merging     : _.template( $("#save-merging-template").html() )
      };

      editor.on("change:openFile", this._openFileChanged, this);
    },

    save : function() {
      editor.get("openFileView").transferContentToModel();
      editor.get("openFile").save();
    },

    enableSaving : function() {
      $("#save-button").removeClass("disabled");
      
      var self = this;
      this.saveWrapper = this.saveWrapper || function() {
        self.save();
      }
      // We remove the event first to make sure only ever get one
      // since we this can be called when the button is already enabled
      $("#save-button").off("click", this.saveWrapper);
      $("#save-button").on("click", this.saveWrapper);
    },

    disableSaving : function() {
      $("#save-button").addClass("disabled");
      $("#save-button").off("click", this.saveWrapper);
    },

    _enableOrDisableSaving : function() {
      // We don't want to save images, etc. Only text.
      if ( !editor.get("openFile") || !editor.get("openFileView") || !(editor.get("openFileView") instanceof TextEditor) ) {
        this.disableSaving();
        return;
      }
      
      // Enable or disable based on saving state of file.
      var saveStatus  = editor.get("openFile").get("saveStatus");
      var mergeStatus = editor.get("openFile").get("mergeStatus");

      if (saveStatus == File.saveStatus.NONE) {
        if (mergeStatus == File.mergeStatus.MERGING) {
          $("#save-status").html(this.templates.merging);
          this.disableSaving();
        } else {
          $("#save-status").html("");
          this.enableSaving();
        }
      } else {
        if (saveStatus == File.saveStatus.SAVING) {
          $("#save-status").html(this.templates.saving);
          this.disableSaving();
        } else if (saveStatus == File.saveStatus.SAVED) {
          $("#save-status").html(this.templates.saveSuccess);
          this.enableSaving();
        } else if (saveStatus == File.saveStatus.ERROR) {
          $("#save-status").html(this.templates.saveError);
          editor.showConnectionErrorDialog();
          this.enableSaving();
        }
      }
    },

    _openFileChanged : function() {
      this._enableOrDisableSaving();

      if (editor.hasChanged("openFile") && editor.previous("openFile")) {
        editor.previous("openFile").off("change:saveStatus change:mergeStatus", this._enableOrDisableSaving);
      }
      if (editor.get("openFile")) {
        editor.get("openFile").on("change:saveStatus change:mergeStatus", this._enableOrDisableSaving, this);
      }
    }
  })

  return Save;
});
