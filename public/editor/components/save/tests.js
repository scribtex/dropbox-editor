define(["tests/test-util"], function(TestUtil) {
  var checkSync;

  return {
    run : function() {
      
      module("Save");

      TestUtil.openFile({
        path    : "test.tex",
        content : "Content 1"
      }, function(file) {
        // Run our tests with our file!
        asyncTest("Saving a file", function() {
          console.log("Testing save button");

          expect(3);

          var content = "Woohoo!"
          editor.get("openFileView").editor.getSession().setValue(content);

          file.off("sync", checkSync || function() {});
          file.on("sync", checkSync = checkSync || function() {
            ok(true, "File saved");            
            equal(file.get("content"), content)
            equal(file.get("content"), editor.get("openFileView").editor.getSession().getValue());
            QUnit.start();
          });

          $("#save-button").click();
        });
      });

    }
  }
});
