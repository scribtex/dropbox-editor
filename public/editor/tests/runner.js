define(function() {
  var tests = arguments;
  return {
    run : function(tests) {
      if (typeof tests === "undefined") {
        tests = ["save", "merge"];
      }
      var testFiles =_.map(tests, function(test) { return "components/" + test + "/tests" });

      require(testFiles, function() {
        QUnit.init();
        QUnit.start();
        for (var i = 0; i < arguments.length; i++) {
          arguments[i].run();
        }
      });
    }
  }
})
