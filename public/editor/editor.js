define([
  "models/file",
  "models/directory",
  "views/main",
  "components/text-editor/text-editor",
  "components/image-viewer/image-viewer",
  "components/save/save",
  "components/merge/merge",
  "components/file-opener/file-opener",
  "components/dialog/dialog"
], function(File, Directory, MainView, TextEditor, ImageViewer, Save, Merge, FileOpener, Dialog) {
  if (typeof console === "undefined" || typeof console.log === "undefined") {
    console = {};
    console.log = function() {};
  }

  var Editor = Backbone.Model.extend({
    defaults : {
      fileBaseUrl   : "/files",
      mergeUrl      : "/merge",
      rootDirectory : Directory.findOrBuild("")
    },

    start : function() {
      this.mainView = new MainView({
        el : $(document.body)
      });
      this.mainView.render();

      this.components = {
        save: new Save(),
        merge: new Merge(),
        fileOpener: new FileOpener()
      }

      editor.on("change:openFile", function() {
        var fileView = editor._getFileViewType(editor.get("openFile").get("type"));
        editor.set("openFileView", new fileView({
          model : editor.get("openFile")
        }));

        $("#file-path").html(editor.get("openFile").get("path").replace(/\//g, " / "));
      });

      editor.on("change:openFileView", function() {
        if (editor.previous("openFileView")) {
          editor.previous("openFileView").close();
        }
        editor.get("openFileView").render();
        $("#editor").html(editor.get("openFileView").el);
      });

      editor.components.fileOpener.showOpenFileDialog();
    },

    _getFileViewType : function(type) {
      if (!type) return TextEditor;

      if (type.match(/^image/)) {
        return ImageViewer;
      }

      return TextEditor;
    },

    showConnectionErrorDialog : function() {
      var self = this;
      if (!this.connectionErrorDialog) {
        this.connectionErrorDialog = new Dialog({
          template : $("#connection-error-dialog-template").html(),
          events   : {
            "click .ok-button" : function() {
              self.connectionErrorDialog.hide()
            }
          }
        })
      }
      this.connectionErrorDialog.show();
    },

    handleAjaxError : function() {
      console.log(arguments);
      editor.showConnectionErrorDialog();
    },

    runTests : function(tests) {
      if (!this.appendedTestTemplate) {
        $(document.body).append($("#tests-template").html());
        this.appendedTestTemplate = true;
      }
      $(document.head).append("<link rel='stylesheet' type='text/css' href='/javascripts/editor/tests/qunit.css'></link>");
      require(["tests/runner", "tests/qunit", "tests/async"], function(Runner) {
        Runner.run(tests);
      })
    }
  })
  
  window.editor = new Editor();
  window.editor.start();
});

