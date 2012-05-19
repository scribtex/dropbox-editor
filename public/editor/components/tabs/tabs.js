define(["components/base", "lib/path_util"], function(Base, PathUtil) {
  var Tabs = Base.extend({
    initialize : function() {
      // We keep track of the open `file`s and corresponding `fileView`s.
      // The indexes in this should be the file's `id` and the entries have
      // the form
      //
      //     {
      //       file      : ..., // The file model
      //       fileView  : ..., // The Backbone view
      //       tabEl     : ..., // The jQuery wrapped element of the tab
      //       tabPaneEl : ...  // The jQuery wrapped element of the tab pane
      //     }
      this.openTabs = {};
    },

    open : function(file, fileView) {
      console.log("opening tab", file, fileView);
      // We should never be asked to open a file twice, but if we are
      // ignore the request.
      if (this.openTabs[file.id]) return;

      var tabEl = $(_.template( $("#tab-template").html(), {
        name : PathUtil.basename(file.get("path")),
        id   : file.cid
      }));
      $("#tab-bar").append(tabEl);

      var tabPaneEl = $(_.template( $("#tab-pane-template").html(), {
        id : file.cid
      }));
      $("#tab-panes").append(tabPaneEl);
      
      fileView.render();
      tabPaneEl.append(fileView.el);

      this.openTabs[file.id] = {
        file      : file,
        fileView  : fileView,
        tabEl     : tabEl,
        tabPaneEl : tabPaneEl
      };

      tabEl.find("a").tab("show");
      tabEl.find("a").on("click", function(e) {
        e.preventDefault();
        $(this).tab("show");
      });
    }
  });

  return Tabs;
});
