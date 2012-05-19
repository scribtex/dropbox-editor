define(["lib/path_util"], function(PathUtil) {
  CLSIClient = {
    compile : function(resources, options) {
      var request = { 
        compile : {
          rootResourcePath : options.rootResourcePath,
          resources        : resources
        }
      };
      
      $.ajax({
        url         : PathUtil.join(editor.get("clsiUrl"), "clsi/compile"),
        type        : "POST",
        contentType : "application/json",
        dataType    : "json",
        data        : JSON.stringify(request),
        success     : function (resp, status, xhr) {
          if (typeof options.success === "function") {
            options.success(resp);
          }
        },
        error       : function (resp, status, xhr) {
          if (typeof options.error === "function") {
            options.error(resp, status, xhr);
          }
        }
      })

    }
  }

  return CLSIClient;
})
