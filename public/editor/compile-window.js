define(["components/pdf-window-view/pdf-window-view"], function(PdfWindowView) {
  var query = {};
  _.each( location.search.slice(1).split("&"), function(part) {
    query[part.split("=")[0]] = part.split("=")[1];
  });

  var pdfUrl, logUrl;
  if (query.success == "true") {
    pdfUrl = "http://localhost:3002/output/" + query.compileId + "/output.pdf";
  }
  logUrl = "/clsi/output/" + query.compileId + "/output.log";

  var view = new PdfWindowView({
    pdfUrl : pdfUrl,
    logUrl : logUrl
  });

  $(document.body).append(view.el);
  view.render();
});

