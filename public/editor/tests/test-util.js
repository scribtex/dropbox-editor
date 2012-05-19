define(["models/file"], function(File) {
  var TestUtil = {
    openFile : function(options, callback) {
      QUnit.stop();
      var file = File.findOrBuild(options.path);
      async.series([
        function(callback) {
          // Grab the revision Id if this file isn't loaded yet.
          console.log("Fetching", file.get("path"));
          file.fetch({
            success: function() { callback() },
            error: function() { 
              // No worries, it probably doesn't exist. We''ll create it below
              callback()
            }
          })
        },
        function(callback) {
          // Ensure the file exists.
          console.log("Saving", file.get("path"), "with custom content");
          file.save({
            content : options.content
          }, {
            success : function(resp) {
              callback();
              file.trigger("sync", file, resp);
            },
            error : function() {
              callback("File save failed");
            }
          })
        },
        function(callback) {
          // Set up the file in the editor
          console.log("Opening", file.get("path"));
          editor.set("openFile", file);
          callback();
        }
      ], function(err) {
        if (err) {
          editor.showConnectionErrorDialog();
        } else {
          callback(file);
        }
        QUnit.start();
      });
    }
  };

  return TestUtil;
});
