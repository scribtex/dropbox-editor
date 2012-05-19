var MergeServer = require("./index");

var merge = new MergeServer();

    merge.$doMerge("one", "two", "three", function(err, success, result) {
        console.log(err, success, result);
    });

