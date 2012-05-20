define([
  "models/file",
  "models/directory",
  "views/main",
  "components/text-editor/text-editor",
  "components/image-viewer/image-viewer",
  "components/save/save",
  "components/merge/merge",
  "components/file-opener/file-opener",
  "components/tabs/tabs",
  "components/dialog/dialog"
], function(File, Directory, MainView, TextEditor, ImageViewer, Save, Merge, FileOpener, Tabs, Dialog) {
  if (typeof console === "undefined" || typeof console.log === "undefined") {
    console = {};
    console.log = function() {};
  }

  var OpenFiles = Backbone.Collection.extend();

  var Editor = Backbone.Model.extend({
    defaults : {
      fileBaseUrl   : "/files",
      mergeUrl      : "/merge",
      rootDirectory : Directory.findOrBuild(""),
      openFiles     : new OpenFiles()
    },

    start : function() {
      this.mainView = new MainView({
        el : $(document.body)
      });
      this.mainView.render();

      this.components = {
        merge      : new Merge(),
        fileOpener : new FileOpener(),
        tabs       : new Tabs()
      }
      // Save depends on `tabs` already existing
      this.components.save = new Save();
    },

    openFile : function(file) {
      // If the file isn't already open we need to insert it into the collection of
      // `openFiles`. Everything else should watch this collection if they need to
      // react to this.
      if (this.get("openFiles").models.indexOf(file) == -1) {
        this.get("openFiles").add(file);

        // Set up the view that will handle displaying the file in the tab pane.
        var fileViewClass = editor._getFileViewType(file.get("type"));
        var fileView = new fileViewClass({
          model : file
        });

        // Display the tab
        this.components.tabs.open(file, fileView);
      } else {
        this.components.tabs.show(file);
      }

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

