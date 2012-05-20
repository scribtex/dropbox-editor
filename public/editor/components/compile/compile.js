define([
  "components/base",
  "components/compile/clsi_client",
  "components/dialog/dialog",
  "components/text-editor/text-editor",
  "components/compile/views/new-window-view",
  "lib/path_util"
], function(Base, CLSIClient, Dialog, TextEditor, NewWindowView, PathUtil) {
  var CompileState = Backbone.Model.extend();

  var Compile = Base.extend({
    initialize : function() {
      this.enableCompiling();
      this.compileState = new CompileState();
      this.view = new NewWindowView({
        model : this.compileState 
      });
    },

    compile : function () {
      this.disableCompiling();

      var self = this;
      editor.get("rootDirectory").populateSubDirectories({
        success : function() {
          self._sendRequest();
        },
        error   : function() {
          editor.showConnectionErrorDialog();
        }
      })
    },

    _sendRequest : function() {
      var resources = [];
      var options = {};


      if (!editor.get("openFile")) {
        this.enableCompiling();
        return;
      }

      var rootResourcePath;
      editor.get("openFiles").each(function(file) {
        if (file.get("content") && file.get("content").match(/\\documentclass/)) {
          rootResourcePath = file.get("path")
        }
      });

      if (!rootResourcePath) {
        this.showNoRootResourceDialog();
        this.enableCompiling();
        return;
      }

      // Lets gather the resources by their ids so that we can override existing ones
      // We'll group them into an array later.
      var resources = {};
      editor.get("rootDirectory").eachFile(function(file) {
        resources[file.id] = {
          path     : file.get("path"),
          url      : PathUtil.join(editor.get("host"), editor.get("fileBaseUrl"), file.get("path")),
          modified : file.get("modified")
        };
      });
      // Override resources with content from open files
      _.each(editor.components.tabs.getOpenFileViews(), function(fileView) {
        if (fileView instanceof TextEditor) {
          var file = fileView.model;
          fileView.transferContentToModel();
          resources[file.id] = {
            content : file.get("content"),
            path    : file.get("path")
          };
        }
      });
      // Flatten our resource down to an array.
      resources = _.map(resources, function(value, key) { return value });
      
      var self = this;
      CLSIClient.compile(resources, {
        rootResourcePath : rootResourcePath,
        success : function(resp) { 
          self.processResponse(resp);
          self.enableCompiling();
        },
        error   : function() {
          editor.showConnectionErrorDialog();
          self.enableCompiling();
        }
      })
    },

    processResponse : function(resp) {
      var pdf = null, log = null;
      if (resp && resp.compile) {
        if (resp.compile.output_files && resp.compile.output_files.length > 0) {
          pdf = resp.compile.output_files[0].url;
        }
        if (resp.compile.logs && resp.compile.logs.length > 0) {
          log = resp.compile.logs[0].url;
        }
      }
      this.compileState.set({
        pdfUrl : pdf,
        logUrl : log
      });
    },

    enableCompiling : function() {
      $("#compile-button").removeClass("disabled");
      var self = this;
      $("#compile-button").on("click.compile", function() { self.compile() });
    },

    disableCompiling : function() {
      $("#compile-button").addClass("disabled");
      $("#compile-button").off("click.compile");
    },

    showNoRootResourceDialog : function() {
      var self = this;
      if (!this.noRootResourceDialog) {
        this.noRootResourceDialog = new Dialog({
          template : $("#no-root-resource-dialog-template").html(),
          events   : {
            "click .ok-button" : function() {
              self.noRootResourceDialog.hide()
            }
          }
        })
      }
      this.noRootResourceDialog.show();
    }
  });

  return Compile;
})
