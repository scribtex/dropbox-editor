define(["models/base", "lib/path_util"], function(Base, PathUtil) {
  var File = Base.extend({
    idAttribute : "path",

    defaults : {
      // Make sure these match the definitions of File.saveStatus and File.mergeStatus
      saveStatus  : "none",
      mergeStatus : "none"
    },

    ajaxOptions : {},

    initialize : function() {
      var self = this;
      
      this.on("sync", function() {
        self.set({
          saveStatus   : File.saveStatus.SAVED,
          mergeStatus  : File.mergeStatus.NONE,
          savedContent : self.get("content")
        });
      });

      this.on("error", function(model, xhr) {
        if (this.get("saveStatus") == File.saveStatus.SAVING) {
          if (xhr.status == 409) { // Conflict
            self.set({
              saveStatus       : File.saveStatus.NONE,
              mergeStatus      : File.mergeStatus.NEEDS_MERGE,
              latestRevisionId : xhr.getResponseHeader("X-Revision-Id")
            });
          } else {
            self.set({
              saveStatus  : File.saveStatus.ERROR,
              mergeStatus : File.mergeStatus.NONE
            });
            editor.handleAjaxError.apply(editor, arguments);
          }
        }
      });
    },

    sync : function(method, model, options) {
      var methodMap = {
        'create': 'POST',
        'update': 'PUT',
        'delete': 'DELETE',
        'read':   'GET'
      };

      var params = {
        type        : methodMap[method],
        url         : this.url(),
        contentType : "text/plain"
      }

      if (method == "update") {
        params.data = this.get("content");
        params.headers = {
          "X-Revision-Id" : this.get("currentRevisionId")
        }

        this.set("saveStatus", File.saveStatus.SAVING);
      }

      if (this.ajaxOptions.ignoreCache) {
        options["beforeSend"] =  function(xhr, settings) {
          xhr.setRequestHeader("If-Modified-Since", null);
        }
      }

      $.ajax(_.extend(params, options));
    },

    parse : function(resp, xhr) {
      var attributes = {};

      if (xhr.getResponseHeader("X-Revision-Id")) {
        attributes.currentRevisionId = xhr.getResponseHeader("X-Revision-Id");
        attributes.latestRevisionId  = xhr.getResponseHeader("X-Revision-Id");
      }

      if (resp) {
        attributes.content = resp
        attributes.savedContent = resp
      }

      return attributes;
    },

    url : function() {
      return PathUtil.join(editor.get("fileBaseUrl"), this.get("path"));
    }
  }, {
    saveStatus : {
      SAVING  : "saving",
      SAVED   : "saved",
      ERROR   : "error",
      NONE    : "none"
    },

    mergeStatus : {
      NEEDS_MERGE : "needs-merge",
      MERGING     : "merging",
      ERROR       : "error",
      NONE        : "none"
    }
  })

  return File;
});
