define(["tests/test-util", "models/file"], function(TestUtil, File) {
  return {
    run : function() {
      module("Merge");

      TestUtil.openFile({
        path : "test.tex",
        content : ["one", "two", "three"].join("\n")
      }, function(file) {
        function editFileTwice(options, callback) {
          // We need another copy to perform our other edits on
          var otherFile = window.otherFile = File.build({
            path : "test.tex"
          });

          async.series([
            function(callback) {
              // Ensure we have up to date version of file
              file.fetch({
                success : function() { callback() }
              });
            },
            function(callback) {
              // Update file with original content
              file.save({
                content : options.originalContent
              }, {
                success : function(resp) {
                  // Need to update file.originalContent
                  file.trigger("sync", file, resp);
                  callback();
                }
              });
            },
            function(callback) {
              // Get another copy of the file to edit
              otherFile.fetch({
                success : function() { callback() }
              });
            },
            function(callback) {
              // Save first edit
              console.log("Saving first edit");
              otherFile.set("content", options.firstEdit);
              otherFile.save({}, {
                success : function() { callback() }
              });
            },
            function(callback) {
              // Save second edit
              console.log("Saving second edit");
              file.set("content", options.secondEdit);
              file.save({}, {
                success : function(resp) { 
                  file.trigger("sync", file, resp) 
                  callback()
                }
              });
            },
          ], function(err) {
            if (callback) callback(file);
          });
        };

        asyncTest("Successful merge", function() {
          expect(3);

          // The file is detected as needing merged
          file.one("change:mergeStatus", function() {
            equal(file.get("mergeStatus"), File.mergeStatus.NEEDS_MERGE);
          });

          // Then the dialog is shown
          var dialog = editor.components.merge.getMergeNeededDialog();
          dialog.dialog.one("shown", function() {
            ok(true);

            // Then the file should be saved
            file.one("sync", function() {
              // Merging adds a new line but that's ok
              equal(file.get("content"), ["uno", "two", "tres"].join("\n") + "\n");
              QUnit.start();
            });

            // If we run this straight away, the change:mergeStatus callback for the file
            // if only run with the file's merge status being 'merged'. It's like some
            // weird scoping is going on that I don't understand. The timeout makes it work
            // though...
            setTimeout(function() {
              $(".merge-button").click();
            }, 200);
          });

          editFileTwice({
            originalContent : ["one", "two", "three"].join("\n"),
            firstEdit       : ["uno", "two", "three"].join("\n"),
            secondEdit      : ["one", "two", "tres"].join("\n")
          });           
        });

        asyncTest("Conflicting edits", function() {
          expect(3);

          // The file is detected as needing merged
          file.one("change:mergeStatus", function() {
            equal(file.get("mergeStatus"), File.mergeStatus.NEEDS_MERGE);
          });

          // Then the dialog is shown
          var dialog = editor.components.merge.getMergeNeededDialog();
          dialog.dialog.one("shown", function() {
            ok(true);

            // Then the file should be updated with the conflicting content
            file.one("change:content", function() {
              equal(file.get("content"), ["<<<<<<< Current", "eins", "=======", "uno", ">>>>>>> Other", "two", "three"].join("\n"));

              setTimeout(function() {
                $("#merge-conflict-dialog").find(".ok-button").click()
              }, 200);
              QUnit.start();
            });

            // If we run this straight away, the change:mergeStatus callback for the file
            // if only run with the file's merge status being 'merged'. It's like some
            // weird scoping is going on that I don't understand. The timeout makes it work
            // though...
            setTimeout(function() {
              $(".merge-button").click();
            }, 200);
          });

          editFileTwice({
            originalContent : ["one", "two", "three"].join("\n"),
            firstEdit       : ["uno", "two", "three"].join("\n"),
            secondEdit      : ["eins", "two", "three"].join("\n")
          });           
        });

        asyncTest("Overwrite", function() {
          expect(3);

          // The file is detected as needing merged
          file.one("change:mergeStatus", function() {
            equal(file.get("mergeStatus"), File.mergeStatus.NEEDS_MERGE);
          });

          // Then the dialog is shown
          var dialog = editor.components.merge.getMergeNeededDialog();
          dialog.dialog.one("shown", function() {
            ok(true);

            // Then the file should be saved
            file.one("sync", function() {
              equal(file.get("content"), ["one", "two", "tres"].join("\n"));
              QUnit.start();
            });

            // If we run this straight away, the change:mergeStatus callback for the file
            // if only run with the file's merge status being 'merged'. It's like some
            // weird scoping is going on that I don't understand. The timeout makes it work
            // though...
            setTimeout(function() {
              $(".overwrite-button").click();
            }, 200);
          });

          editFileTwice({
            originalContent : ["one", "two", "three"].join("\n"),
            firstEdit       : ["uno", "two", "three"].join("\n"),
            secondEdit      : ["one", "two", "tres"].join("\n")
          });        
        });
      });
    }
  }
})
