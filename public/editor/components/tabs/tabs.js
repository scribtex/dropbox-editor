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
      // If the tabs is already open just show it.
      if (this.openTabs[file.id]) {
        this.show(file);
        return;
      }

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

      var tab = {
        file      : file,
        fileView  : fileView,
        tabEl     : tabEl,
        tabPaneEl : tabPaneEl
      };

      this.openTabs[file.id] = tab;

      this._addEventListeners(tabEl, file, fileView);

      this.show(file);
    },

    close : function(file) {
      // Get the information about the file tab we are closing.
      // We bail out if the file isn't open in a tab.
      var tab = this.openTabs[file.id];
      if (!tab) return;

      // Remove it from the places the open files and tabs are stored.
      delete this.openTabs[file.id];
      editor.get("openFiles").remove(file);

      // Open the previous tab
      var previousTabEl = tab.tabEl.prev();
      if (previousTabEl.length > 0) {
        setTimeout(function() {
          previousTabEl.find("a").tab("show");
        }, 10);
      } else {
        editor.set({
          openFile     : null,
          openFileView : null
        })
      }

      tab.tabEl.prev().tab("show")

      // Unbind everything
      tab.fileView.close();
      tab.tabPaneEl.remove();
      tab.tabEl.remove();

      this._removeEventListeners(tab.tabEl);
    },

    show : function(file) {
      var tab = this.openTabs[file.id];
      if (!tab) return;

      tab.tabEl.find("a").tab("show");
    },

    _removeEventListeners : function(tabEl) {
      tabEl.find("a").off("click.tabs");
      tabEl.find("a").off("shown.tabs");
      tabEl.find(".tab-close").off("click.tabs");
    },

    _addEventListeners : function(tabEl, file, fileView) {
      tabEl.find("a").on("click.tabs", function(e) {
        e.preventDefault();
        $(this).tab("show");
      });

      var self = this;
      tabEl.find("a").on("shown.tabs", function(e) {
        editor.set({
          openFile     : file,
          openFileView : fileView
        });
      });

      tabEl.find(".tab-close").on("click.tabs", function(e) {
        e.preventDefault();
        self.close(file);
      });
    }
  });

  return Tabs;
});
