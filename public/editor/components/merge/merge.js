define(["components/base", "models/file", "components/dialog/dialog"], function(Component, File, Dialog) {
  var Merge = Component.extend({
    initialize : function() {
      var self = this;
      editor.on("change:openFile", function() {
        if (editor.hasChanged("openFile") && editor.previous("openFile")) {
          editor.previous("openFile").off("change:mergeStatus", self.margeStatusChanged);
        }
				if (editor.get("openFile")) {
        	editor.get("openFile").on("change:mergeStatus", self.mergeStatusChanged, self);
				}
      });
    },

    mergeStatusChanged : function(file, status) {
      if (status == File.mergeStatus.NEEDS_MERGE) {
        this.showMergeNeededDialog();
      }
    },

    showMergeNeededDialog : function() {
      this.getMergeNeededDialog().show();
    },

    getMergeNeededDialog : function() {
      var self = this;
      if (!this.mergeNeededDialog) {
        this.mergeNeededDialog = new Dialog({
          template : $("#merge-needed-dialog-template").html(),
          events   : {
            "click .cancel-button" : function() {
              self.mergeNeededDialog.hide();
              editor.get("openFile").set("mergeStatus", File.mergeStatus.NONE);
            },
            "click .overwrite-button" : function() {
              self.overwrite()
            },
            "click .merge-button" : function() {
              self.merge()
            }
          }
        });
      }
      return this.mergeNeededDialog;
    },

    showMergeConflictDialog : function() {
      var self = this;
      if (!this.mergeConflictDialog) {
        this.mergeConflictDialog = new Dialog({
          template : $("#merge-conflict-dialog-template").html(),
          events   : {
            "click .ok-button" : function() {
              self.mergeConflictDialog.hide()
            }
          }
        })
      }
      this.mergeConflictDialog.show();
    },

    overwrite : function() {
      this.mergeNeededDialog.hide();

      var openFile = editor.get("openFile")
      openFile.set({
        currentRevisionId : openFile.get("latestRevisionId"),
        mergeStatus       : File.mergeStatus.NONE
      });
      openFile.save();
    },

    merge : function() {
      // We need to get the updated contents of the file first
      var latestFile = new File({ path : editor.get("openFile").get("path") });

      editor.get("openFile").set({
        mergeStatus : File.mergeStatus.MERGING
      })
      
      var self = this;
      latestFile.on("change:content", function(model, latestContent) {
        $.ajax({
          url         : editor.get("mergeUrl"),
          type        : "POST",
          contentType : "application/json",
          dataType    : "json",
          data        : JSON.stringify({
            base    : editor.get("openFile").get("savedContent"),
            current : editor.get("openFile").get("content"),
            other   : latestContent
          }),
          success: function(resp, status, xhr) {
            editor.get("openFile").set({
              content           : resp.result,
              mergeStatus       : File.mergeStatus.NONE,
              currentRevisionId : editor.get("openFile").get("latestRevisionId")
            });

            if (resp.clean) {
              editor.get("openFile").save();
            } else {
              self.showMergeConflictDialog();
            }
          },
          error : function() {
            editor.get("openFile").set({
              mergeStatus : File.mergeStatus.ERROR
            })
            editor.showConnectionErrorDialog();
          }
        });

        latestFile.off();
      });

      latestFile.ajaxOptions.ignoreCache = true;
      latestFile.fetch();

      this.mergeNeededDialog.hide();
    }
  });

  return Merge;
});
