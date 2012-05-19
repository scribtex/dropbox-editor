var fs            = require("fs");
var express       = require("express");
var connect       = require("connect");
var MergeServer   = require("./server/merge");

var config = JSON.parse(fs.readFileSync(__dirname + "/config/config.json"));

var dbox = require("dbox").app({ "app_key" : config.dropbox.key, "app_secret" : config.dropbox.secret });

var app = express.createServer();

app.use(connect.cookieParser(config.cookie.secret));
app.use(connect.cookieSession({ key: "scribtex-dropbox" }));
app.use(connect.static("public"));

app.get("/session/new", function(req, res, next) {
  dbox.request_token(function(status, dboxRes) {
    req.session.dropbox_oauth_token = dboxRes.oauth_token;
    req.session.dropbox_oauth_token_secret = dboxRes.oauth_token_secret;

    res.writeHead(302, {
      "Location" : dboxRes.authorize_url + "&oauth_callback=" + encodeURIComponent(config.host + "/session/create")
    });
    res.end();
  });
});

app.get("/session/create", function(req, res, next) {
  dbox.access_token({ oauth_token : req.session.dropbox_oauth_token, oauth_token_secret : req.session.dropbox_oauth_token_secret }, function(status, dboxRes) {
    req.session.dropbox_oauth_token = dboxRes.oauth_token;
    req.session.dropbox_oauth_token_secret = dboxRes.oauth_token_secret;

    res.write("Ok, you're good to go!");
    res.end();
  });
});

function redirectToLogin(req, res, next) {
  res.writeHead(304, {
    Location : "/session/new"
  });
  res.end();
};

app.get(/^\/files\/(.*)/, function(req, res, next) {
  var filePath = req.params[0];
  var client = dbox.createClient({
    oauth_token : req.session.dropbox_oauth_token,
    oauth_token_secret : req.session.dropbox_oauth_token_secret
  });
  client.get(filePath, function(status, reply, metadata) {
    try {
      metadata = JSON.parse(metadata);
    } catch (e) {
      metadata = {};
    }

    var headers = {};
    if (metadata) {
      headers = {
        "Content-Type"  : metadata["mime_type"],
        "X-Revision-Id" : metadata["rev"],
        "X-Icon"        : metadata["icon"]
      }
    }

    console.log(filePath, status, reply);
    res.writeHead(status, headers);
    res.write(reply || ""); // Sometimes reply is undefined. Blank file?
    res.end();
  });
});

app.put(/^\/files\/(.*)/, function(req, res, next) {
  var filePath = req.params[0];
  var client = dbox.createClient({
    oauth_token : req.session.dropbox_oauth_token,
    oauth_token_secret : req.session.dropbox_oauth_token_secret
  });

  var body = ""
  req.on("data", function(chunk) {
    body += chunk;
  });
  req.on("end", function() {
    var args = {};
    if (req.headers["x-revision-id"]) {
      args.parent_rev = req.headers["x-revision-id"];
    }
    client.put(filePath, body, args, function(status, metadata) {
      if (metadata) {
        if (metadata.path != "/" + filePath) {
          // We have to create a new client because dbox doesn't let you change 
          // the set options
          var client = dbox.createClient({
            oauth_token        : req.session.dropbox_oauth_token,
            oauth_token_secret : req.session.dropbox_oauth_token_secret
          });
          client.metadata(filePath, function(status, metadata) {
            returnResponse(409, metadata);
          });
        } else {
          returnResponse(status, metadata);
        }
      }

      function returnResponse(status, metadata) {
        var headers = {};
        if (metadata) {
          headers = {
            "Content-Type"  : metadata.mime_type,
            "X-Revision-Id" : metadata.rev
          }
        }

        res.writeHead(status, headers);
        res.end();
      }
    });
  });
  
});

function formatMetadata(metadata) {
  var formatted = {
    size : metadata.bytes,
    modified : metadata.modified,
    path : metadata.path,
    mimetype : metadata.mime_type,
    type : metadata.is_dir ? "directory" : "file",
    revision_id : metadata.rev,
    icon : metadata.icon
  };

  if (metadata.contents) {
    formatted.entries = [];
    for (var i = 0; i < metadata.contents.length; i++) {
      formatted.entries.push(formatMetadata(metadata.contents[i]));
    }
  }

  return formatted;
};

app.propfind(/^\/files\/(.*)/, function(req, res, next) {
  var filePath = req.params[0];
  var client = dbox.createClient({
    oauth_token : req.session.dropbox_oauth_token,
    oauth_token_secret : req.session.dropbox_oauth_token_secret
  });

  client.metadata(filePath, function(status, metadata) {
    res.writeHead(status);
    res.write(JSON.stringify(formatMetadata(metadata)));
    res.end();
  });
});

var merge = new MergeServer({
  mount : "/merge"
});
merge.attach(app);

app.listen(3000);

