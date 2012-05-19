define(["models/base", "models/file", "lib/path_util"], function(Base, File, PathUtil) {
  var DirectoryEntries = Backbone.Collection.extend({});

  // Directory
  // =========
  // 
  // See [Finding and creating models](base.html) for the features that the
  // `Base` class provides.
  var Directory = Base.extend({
    idAttribute : "path",

    // We use the `populated` flag
    // to determine whether a directory is empty because
    // it hasn't been loaded, or whether it is genuinely empty.
    defaults : {
      populated : false
    },

    // Initialize a blank set of entries. This is not set in defaults otherwise
    // each model would have the same `entries` object.
    initialize : function() {
      this.set("entries", new DirectoryEntries());
    },

    // Our backend is inspired by a mixture of WEBDAV and the Dropbox API.
    sync : function(method, model, options) {
      // The only method currently implemented for directories is PROPFIND
      // which returns a list of the directories properties and its entries.
      var methodMap = {
        'read':   'PROPFIND'
      };

      // Eventually we'll allow updates to directories.
      if (!methodMap[method]) {
        throw new Error("I can't " + method + " a directory, sorry");
      }

      // Send the request via the jQuery AJAX method.
      var params = {
        type        : methodMap[method],
        url         : this.url(),
        contentType : "text/json",
        dataType    : "json"
      }
      $.ajax(_.extend(params, options));
    },

    // A typical response from a PROPFIND request looks like
    //
    //     {
    //          ...
    //     }
    parse : function(data, xhr) {
      var self = this;
      _.each(data.entries, function(entry) {
        // Paths may be returned from the server with a leading slash,
        // but our canonical form for paths is without a leading slash.
        var path = PathUtil.stripLeadingSlashes(entry.path);

        // Load the entries as either File or Directory models. See
        // [Finding and creating models](base.html) for the `findOrBuild`
        // method.
        if (entry.type == "directory") {
          var dir = Directory.findOrBuild(path);
          dir.set({
            modified : entry.modified,
            icon     : entry.icon
          });
          self.get("entries").add(dir);
        } else if (entry.type == "file") {
          var file = File.findOrBuild(path);
          file.set({
            size     : entry.size,
            type     : entry.mimetype,
            modified : entry.modified,
            icon     : entry.icon
          });
          self.get("entries").add(file);
        }
      });
      
      return {
        populated : true,
        icon      : data.icon,
        modified  : data.modified
      }
    },

    url : function() {
      return PathUtil.join(editor.get("fileBaseUrl"), this.get("path"));
    },

    populateSubDirectories : function(options) {
      var self = this;
      function _populateSubDirectories() { 
        self.get("entries").each( function(entry) {
          if (entry instanceof Directory) {
            if (!entry.get("populated")) {
              Directory.fetchQueue.push(entry);
            }
          }
        });

        self._fetchNextInQueue(options);
      }

      options = options || {};
      options.originalDirectory = options.originalDirectory || this;

      if (!this.get("populated")) {
        this.fetch({
          error : options.error,
          success : function() {
            _populateSubDirectories(options)
          }
        })
      } else {
        _populateSubDirectories();
      }

      return this;
    },

    _fetchNextInQueue : function(options) {
      while (Directory.openFetches < Directory.maxFetches) {
        // Use a first in first out system to that we do a breadth first search
        var next = Directory.fetchQueue.shift();
        if (!next) break;

        Directory.openFetches += 1;
        next.fetch({
          success : function(directory, resp) {
            Directory.openFetches -= 1;
            directory.populateSubDirectories(options);
          },
          error : function(directory, resp) {
            Directory.openFetches -= 1;
            if (typeof options.error == "function") {
              options.error(directory, resp);
            }
          }
        });
      } 

      if (Directory.fetchQueue.length == 0 && Directory.openFetches == 0) {
        if (typeof options.success == "function") {
          options.success(options.originalDirectory);
        }
      }
    },

    printTree : function(depth) {
      if (typeof depth == "undefined") depth = "";

      var str = ""
      this.get("entries").each(function(entry) {
        str += depth + entry.get("path") + "\n";
        if (entry instanceof Directory) {
          str += entry.printTree(depth + "  ");
        }
      });

      return str;
    },

    eachFile : function(callback) {
      this.get("entries").each(function(entry) {
        if (entry instanceof Directory) {
          entry.eachFile(callback);
        } else if (entry instanceof File) {
          callback(entry);
        }
      })
    }
  }, {
    maxFetches  : 3,
    openFetches : 0,
    fetchQueue  : []
  });

  return Directory;
});
