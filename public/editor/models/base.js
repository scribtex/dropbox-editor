define(function() {
  // Finding and creating models
  // ===========================
  // 
  // We might need to get access to a model from anywhere and we want
  // to make sure that we don't end up with multiple models all pointing
  // to the same resource on the server. The methods here let you create
  // and find all the models that are currently loaded so that we never
  // accidentally duplicate something. E.g.
  //
  //     var Train = Base.extend();
  //     var thomas = Train.findOrBuild("thomas");
  //     thomas == Train.findOrBuild("thomas"); // true
  //     thomas == new Train({ "id" : "thomas" }); // false
  // 
  // Models are indexed by their `idAttribute` as specified by
  // Backbone. By default this is `id`, but whatever it is set to it 
  // should uniquely identify the server resource that the model corresponds to.
  var Base = Backbone.Model.extend({}, {
    // When trying to get a reference to a model, you should use `findOrBuild`.
    // This takes one argument which is the model's `id` and will either return the
    // existing model with that `id` or create it if it doesn't exist.
    findOrBuild : function(id) {
      var model = this.find(id);
      if (model) return model;

      var options = {};
      options[this.prototype.idAttribute] = id;
      return this.build(options);
    },

    // `build` is a wrapper for the usual `new Model()`. It instantiates the model
    // but then saves it in the index of loaded models.
    build : function(options) {
      var model = new this(options);

      this.loadedModels = this.loadedModels || {};
      this.loadedModels[model.id] = model;

      // It's possible for a model's id to change. If it does we update our index.
      var self = this;
      model.on("change:" + model.idAttribute, function() {
        self.loadedModels[model.id] = self.loadedModels[model.previous(model.idAttribute)]
        delete self.loadedModels[model.previous(model.idAttribute)];
      })

      return model;
    },

    // `find` looks up a model in the index and returns it if it's present.
    find : function(id) {
      this.loadedModels = this.loadedModels || {};
      return this.loadedModels[id];
    }
  });

  return Base;
});
