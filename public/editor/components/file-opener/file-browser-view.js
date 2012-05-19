define(["models/directory", "lib/path_util"], function(Directory, PathUtil) {
  // FileBrowserView
  // ===============
  //
  // A FileBrowserView provides a list of files and folders that can be navigated.
  // The sort of thing that's useful in an open dialog or save dialog.
  // 
  // Overview
  // --------
  // 
  // The main class `FileBrowserView` keeps track of which directory is being
  // displayed and creating the list of files.
  // The actual file entries in the list are handled by `FileListEntryView` which is
  // mostly just responsible for rendering and reporting the events that
  // happen to each entry.
  // 
  // FileListEntryView
  // -------------------
  var FileListEntryView = Backbone.View.extend({
    // A single click will select a file/directory while a double click
    // will open it. I think this is pretty standard.
    events : {
      "click"    : "select",
      "dblclick" : "open"
    },

    // Rendering of each entry is deferred to a template.
    render : function() {
      this.$el.append(
        _.template( $("#file-list-entry-template").html(), {
          name : this.options.name || PathUtil.basename(this.model.get("path")),
          icon : this.options.icon || this.model.get("icon")
        })
      );
      return this;
    },

    // The `open` method just proxies the event from double clicking
    // the HTML element.
    open : function() {
      this.trigger("open");
    },

    // The `select` method proxies the event from a single click. It also
    // updates the CSS of the entry to show that it is selected.
    select : function() {
      this.trigger("select");
      this.$(".file-list-entry").addClass("selected");
    },

    // The `unselect` method is called from a `FileListEntryView` instance
    // when another entry has been selected.
    unselect : function () {
      this.trigger("unselect");
      this.$(".file-list-entry").removeClass("selected");
    },

    // Stop all of our event bindings hanging around once we're gone
    onClose : function() {
      this.off();
    }
  });

  // FileBrowserView
  // ---------------
  var FileBrowserView = Backbone.View.extend({
    
    initialize: function() {
      // We show a list of files in a directory by rendering a list of 
      // `FileListEntryView` instances. The `entryViews` attribute keeps 
      // track of these.
      this.entryViews = [];

      // When the user presses up or down we'll move the selection
      // up or down. Enter will open the selection.
      var self = this;
      $(document.body).on("keydown", function(e) {
        if (self.$el.is(":visible")) {
          if (e.keyCode == 40) { // Down
            self._moveSelection(1);
            e.preventDefault();
          } else if (e.keyCode == 38) { // Up
            self._moveSelection(-1);
            e.preventDefault();
          } else if (e.keyCode == 13) { // Enter
            self.openSelected();
            e.preventDefault();
          }
        }
      })
    },
    
    // Rendering first renders our template and then populates our list by
    // opening the directory.
    render : function() {
      this.$el.html( _.template( $("#file-list-template").html() ) );
      this._openDirectory(this.model);
      return this;
    },

    // If an entry in the list is selected we will try to open it.
    // For a directory this means replacing the list of files with
    // the new directory's list. For a file this means actually opening it.
    // This isn't our responsibility so we just trigger an event for whoever
    // wants to open it.
    openSelected : function() {
      if (this.selectedEntryView) {
        var entry = this.selectedEntryView.model;
        if (entry instanceof Directory) {
          this._openDirectory(entry);
        } else {
          this.trigger("open", entry);
        }
      }
    },

    // The `_openDirectory` method changes which directory we are displaying.
    _openDirectory : function(directory) {
      // First we stop listening to the old model
      this._unbindFromModel();

      // Then we remove the existing `entryViews`.
      _.each(this.entryViews, function(entryView) {
        this._remove
        entryView.close();
      });
      this.entryViews = [];

      // Then we swap over to our new model
      this.model = directory;
      this._bindToModel();
      
      // And finally repopulate the entry views
      if (this.model !== editor.get("rootDirectory")) {
        this._insertEntry(Directory.findOrBuild(
          PathUtil.dirname(this.model.get("path"))
        ), {
          name : "Previous",
          icon : "arrow_turn_left"
        });
      }
      if (this.model.get("populated")) {
        var self = this;
        this.model.get("entries").each(function(entry) {
          self._insertEntry(entry);
        })
      } else {
        this._showLoading();
        this.model.fetch();
      }
    },

    // We need to listen out for entries being changed so that we can update our view.
    _bindToModel : function() {
      this.model.get("entries").on("add", this.entriesAddListener = function(entry) {
        this._removeLoading();
        this._insertEntry(entry);
      }, this);
    },

    // When swapping models we want to remove any events that we're listening for.
    _unbindFromModel : function() {
      this.model.get("entries").off("add", this.entriesAddListener, this);
    },

    // Add in the loading element to show that something is happening
    _showLoading : function() {
      if (!this.$loadingEl) {
        this.$loadingEl = $( $("#file-list-loading-template").html() );
      }
      this.$(".file-list").append(this.$loadingEl);
    },
    
    // Remove the loading element, presumably because we have some entries to add.
    _removeLoading : function() {
      if (this.$loadingEl) {
        this.$loadingEl.remove();
      }
    },

    // Create a new `FileListEntryView` instance for the passed `entry` and
    // insert it into our list. We also start listening for any events on it.
    _insertEntry : function(entry, options) {
      var entryView = new FileListEntryView(_.extend(options || {}, {
        model : entry
      }));
      
      this._bindToEntryView(entryView);
      this.entryViews.push(entryView);
      this.$(".file-list").append(entryView.render().el);
    },

    // Bind to the events emitted by the `entryView`.
    // We don't need to worry about unbinding from these events since they are 
    // removed on the `close()` call of the `entryView`.
    _bindToEntryView : function(entryView) {
      entryView.on("select", function() {
        this._setSelection(entryView);
      }, this);
      
      entryView.on("open", function() {
        this._setSelection(entryView);
        this.openSelected();
      }, this);
    },

    // Update our knowledge of the selected entry and trigger an event in case
    // somebody else cares what is selected.
    _setSelection : function(entryView) {
      if (this.selectedEntryView) {
        this.selectedEntryView.unselect();
      }
      this.selectedEntryView = entryView;
      this.trigger("change:selection", entryView.model);
    },

    // Remove our reference to a selected item. This is for cases when no
    // new item is selected, such as a new directory has just been open.
    // We trigger an event in case somebody else cares what is selected, but
    // with `null` as the model.
    _removeSelection : function() {
      if (this.selectedEntryView) {
        this.selectedEntryView.unselect();
      }
      delete this.selectedEntryView;
      this.trigger("change:selection", null);
    },

    // Move the selection onto the entry with is `offset` entries
    // away from the currently selected entry.
    _moveSelection : function(offset, scrollIntoView, selectIfUnselected) {
      if (typeof scrollIntoView == "undefined") scrollIntoView = true;
      if (typeof selectIfUnselected == "undefined") selectIfUnselected = true;
      
      if (!this.selectedEntryView && !selectIfUnselected) return;

      var index = this.entryViews.indexOf(this.selectedEntryView) + offset;
      if (index < 0) index = 0;
      if (index > this.entryViews.length - 1) index = this.entryViews.length - 1;

      var view = this.entryViews[index];
      view.select();

      if (scrollIntoView) {
        // Scroll the entry into visibility
        // Note that this needs the parent element to have relative positioning
        // in the css.
        var elementLowerOffset = view.$el.position().top + 
                                 view.$el.outerHeight() - 
                                 $(".file-list-wrapper").innerHeight(); 

        if (elementLowerOffset > $(".file-list-wrapper").scrollTop()) {
          $(".file-list-wrapper").scrollTop(elementLowerOffset);
        }

        if (view.$el.position().top < $(".file-list-wrapper").scrollTop()) {
          $(".file-list-wrapper").scrollTop(view.$el.position().top);
        }
      }
    }
  });

  return FileBrowserView;
});

