define(function() {
  var PathUtil = {
    join : function(a, b) {
      if (arguments.length > 2) {
        var rest = Array.prototype.slice.call(arguments, 2, arguments.length);
        rest.unshift(PathUtil.join(arguments[0], arguments[1]));
        return PathUtil.join.apply(PathUtil, rest);
      } else {
        return PathUtil.stripTrailingSlashes(a) + "/" + PathUtil.stripLeadingSlashes(b);
      }
    },

    stripTrailingSlashes : function(a) {
      return a.replace(/(\/)*$/, "");
    },

    stripLeadingSlashes : function(a) {
      return a.replace(/^(\/)*/, "");
    },

    relativePath : function(base, path) {
      if (base != path.slice( 0, base.length )) {
        return null;
      }

      var relativePath = path.slice(base.length);
      return PathUtil.stripLeadingSlashes(relativePath);
    },

    basename : function(path) {
      return path.split("/").slice(-1)[0];
    }
  };

  return PathUtil;
})
