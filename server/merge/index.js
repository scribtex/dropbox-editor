var async   = require("async");
var Express = require("express");
var fs      = require("fs");
var path    = require("path");
var Spawn   = require("child_process").spawn;
var tmp     = require("tmp");

var MergeServer = module.exports = function(options) {
    this.options = options || {};
};

(function() {
    this.listen = function() {
        var server = Express.createServer();

        this.attach(server);
        server.listen.apply(server, arguments);
    };
    
    this.attach = function(expressServer) {
        this.server = expressServer;
        
        this.server.all(this.options.mount, this.mergeFiles.bind(this));
    };

    this.mergeFiles = function(req, res, next) {
        var body = ""
        req.on("data", function(chunk) {
            body += chunk;
        });

        var self = this;
        req.on("end", function() {
            function sendError(code, err) {
                res.writeHead(code) // Bad Request
                res.write(JSON.stringify({
                    "error" : err
                }));
                res.end();
            }

            try {
                var data = JSON.parse(body);
            }
            catch(e) {
                sendError(400 /* Bad request */, "Malformed JSON request");
                return;
            }

            if (typeof data.current != "string" || typeof data.base != "string" || typeof data.other != "string") {
                sendError(400, "Missing or malformed 'current', 'base' or 'other' property");
                return;
            }

            self.$doMerge(data.current, data.base, data.other, function(err, success, result) {
                if (err) {
                    sendError(500 /* Internal server error */, err);
                    return;
                }

                res.write(JSON.stringify({
                    clean  : success,
                    result : result
                }));
                res.end();
            });
        });
    };

    this.$doMerge = function(current, base, other, callback) {
        function writeTempFile(name, content) {
            return function(callback) {
                tmp.file(function(err, path, fd) {
                    if (err) {
                        callback(err);
                        return;
                    }

                    fs.write(fd, content, undefined, undefined, function(err, written, buffer) {
                        callback(err, path);
                    });
                });
            };
        }

        // We do a three way merge with `base` as the base file, 
        // `current` as the file changed by one user and `other`
        // as the file changed by another user.
        async.auto({
            writeCurrent : writeTempFile("current", current),
            writeBase    : writeTempFile("base", base),
            writeOther   : writeTempFile("other", other),
            doMerge      : ["writeCurrent", "writeBase", "writeOther", function(callback, results) {
                var child = Spawn("git", [
                    "merge-file",
                    "-p",
                    "-L", "Current",
                    "-L", "Base",
                    "-L", "Other",
                    results.writeCurrent,
                    results.writeBase,
                    results.writeOther
                ]);

                var result = "";
                var err    = "";
                var self   = this;

                child.stdout.on("data", function(data) {
                    result += data.toString("utf8");
                });
                child.stderr.on("data", function(data) {
                    err += data.toString("utf8");
                });

                child.on("exit", function(code) {
                    if (code < 0 || err) {
                        callback(err)
                    } else if (code == 0) {
                        callback(null, true, result);
                    } else if (code > 0) {
                        callback(null, false, result);
                    }
                });
            }]
        }, function(err, results) {
            if (err) {
                callback(err);
            } else {
                callback(err, results.doMerge[0], results.doMerge[1]);
            }
        })
    };
}).call(MergeServer.prototype);
