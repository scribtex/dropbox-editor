define([
  "components/base",
  "components/compile/clsi_client",
  "components/dialog/dialog",
  "components/compile/views/new-window-view",
  "lib/path_util"
], function(Base, CLSIClient, Dialog, NewWindowView, PathUtil) {
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

      editor.get("openFileView").transferContentToModel();

      var rootResourcePath;
      if (editor.get("openFile").get("content").match(/\\documentclass/)) {
        rootResourcePath = editor.get("openFile").get("path")
      } else {
        rootResourcePath = editor.get("mainFile");
      }

      if (!rootResourcePath) {
        this.showNoRootResourceDialog();
        this.enableCompiling();
        return;
      }

      editor.get("rootDirectory").eachFile(function(file) {
        if (file === editor.get("openFile")) {
          resources.push({
            content : file.get("content"),
            path    : file.get("path")
          });
        } else {
          resources.push({
            path    : file.get("path"),
            url     : PathUtil.join(editor.get("origin"), editor.get("fileBaseUrl"), file.get("path")),
            modifed : file.get("lastModified")
          });
        }
      });
      
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
      $("#compile-button").on("click", function() { self.compile() });
    },

    disableCompiling : function() {
      $("#compile-button").addClass("disabled");
      $("#compile-button").off("click");
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
