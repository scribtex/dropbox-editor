define(["components/pdf-window-view/pdf-window-view"], function(PdfWindowView) {
  var pdfUrl, logUrl;
  if (config.success) {
    pdfUrl = "http://" + config.clsiHost + "/output/" + config.compileId + "/output.pdf";
  }
  logUrl = config.clsiProxy + "/output/" + config.compileId + "/output.log";

  var view = new PdfWindowView({
    pdfUrl : pdfUrl,
    logUrl : logUrl
  });

  $(document.body).append(view.el);
  view.render();
});
