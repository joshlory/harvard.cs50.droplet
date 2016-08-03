define(function(require, exports, module) {
  var droplet = require('./lib/droplet/droplet-full.js');
  require('./lib/jquery.min.js');
  var $ = jQuery;
  var tooltipster = require('./lib/tooltipster/dist/js/tooltipster.bundle.js');

  var worker = null;

  // createWorker
  //
  // Worker hack to avoid cross-domain issues. In the case where
  // we are not allowed to request the worker URL, create a worker with just
  // an importScripts() call to it, which should get around cross-domain
  // security.
  function createWorker(mod) {
    // Get the URL of the worker from its module name
    if (require.nameToUrl && !require.toUrl)
      require.toUrl = require.nameToUrl;

    var workerUrl = workerUrl || require.toUrl(mod);

    // Try instantiating it
    try {
      return new Worker(workerUrl);
    } catch(e) {
      if (e instanceof window.DOMException) {
        // Likely same origin problem. Use importScripts from a shim Worker
        var blob = workerBlob(workerUrl);
        var URL = window.URL || window.webkitURL;
        var blobURL = URL.createObjectURL(blob);

        var worker = new Worker(blobURL);

        setTimeout(function() { // IE EDGE needs a timeout here
          URL.revokeObjectURL(blobURL);
        });

        return worker;
      } else {
        // Some other unknown error
        throw e;
      }
    }
  };

  // workerBlob
  //
  // Create the importScripts() shim for use in createWorker()
  function workerBlob(url) {
    var script = "importScripts('" + url + "');";
    try {
      return new Blob([script], {"type": "application/javascript"});
    } catch (e) { // Backwards-compatibility
      var BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder;
      var blobBuilder = new BlobBuilder();
      blobBuilder.append(script);
      return blobBuilder.getBlob("application/javascript");
    }
  }

  // Map from Ace language modes to Droplet options
  // objects. Currently only C is supported.
  var OPT_MAP = {
    'ace/mode/c_cpp': JSON.parse(require("text!./droplet-configs/c_cpp.json"))
  };

  var useBlocksByDefault = true;

  main.consumes = ["Plugin", "tabManager", "ace", "ui", "commands", "menus", "settings"];
  main.provides = ["c9.ide.cs50.droplet"];
  return main;

  function main(options, imports, register) {
    var Plugin = imports.Plugin;
    var tabManager = imports.tabManager;
    var ace = imports.ace;
    var ui = imports.ui;
    var commands = imports.commands;
    var menus = imports.menus;
    var settings = imports.settings;

    /***** Initialization *****/

    var plugin = new Plugin("CS50", main.consumes);
    var emit = plugin.getEmitter();

    window._lastEditor = null; // This is a debug variable/

    settings.on("read", function() {
      settings.setDefaults("user/cs50/droplet", [
          ["useBlocksByDefault", true]
      ]);
    });

    function load() {

      // Wrap all existent Ace instances in a Droplet
      // instance.
      tabManager.once("ready", function() {

        tabManager.getTabs().forEach(function(tab) {
          var ace = tab.path && tab.editor.ace;
          if (ace && tab.editorType == "ace") {
            attachToAce(tab.editor.ace);
          }
        });

        ace.on("create", function(e) {
          e.editor.on("createAce", attachToAce, plugin);
        }, plugin);

      });

      // Hack to add necessary stylesheets, because ui.insertCss
      // does not work here for some reason. Append
      // <link> elements to the top of the page.
      function forceAddCss(mod) {
        var linkElement = document.createElement('link');
        linkElement.setAttribute('rel', 'stylesheet');
        linkElement.setAttribute('href', require.toUrl(mod));
        document.head.appendChild(linkElement);
      }
      forceAddCss("./lib/droplet/droplet.css");
      forceAddCss("./tooltipster/dist/css/tooltipster.bundle.min.css");
      forceAddCss("./css/style.css");

      // Load user setting for whether to open new files
      // in blocks mode or not
      useBlocksByDefault = settings.get("user/cs50/droplet/@useBlocksByDefault");
    }

    function unload() {
      // Destroy Droplet editors
      tabManager.getTabs().forEach(function(tab) {
        var ace = tab.path && tab.editor.ace;
        if (ace) {
          detachFromAce(tab.editor.ace);
        }
      });
    }

    /***** Methods *****/

    // Create a single worker thread to do background
    // parses for Droplet. All instances of Droplet will share
    // this worker.
    var worker = createWorker('./lib/droplet/worker.js');

    // updateDropletMode
    //
    // Update the Droplet language mode to refelct the Ace editor
    // Droplet mode.
    function updateDropletMode(aceEditor) {
      if (aceEditor._dropletEditor.hasSessionFor(aceEditor.getSession())) {
        // Set the mode and the palette
        aceEditor._dropletEditor.setMode(lookupMode(aceEditor.getSession().$modeId), lookupModeOptions(aceEditor.getSession().$modeId));
        aceEditor._dropletEditor.setPalette(lookupPalette(aceEditor.getSession().$modeId));
      } else {
        // If we didn't originally bind a session (i.e. the editor
        // started out in a language that wasn't supported by Droplet),
        // create one now before setting the language mode.
        var option = lookupOptions(aceEditor.getSession().$modeId);
        if (option != null) {
          aceEditor._dropletEditor.bindNewSession(option);
        }
      }
    }

    // attachToAce
    //
    // Called initially on all ace editors and then again
    // any time a new ace editor is created. Wraps the ace editor
    // in a Droplet instance and sets up that Droplet instance to mimic
    // the ace editor.
    function attachToAce(aceEditor) {
      // (Do no actions if there is already
      // a Droplet instance attached to this ace
      // editor)
      if (!aceEditor._dropletEditor) {

        // Add the toggle button to the lower-right corner
        var button = $('<div class="label droplet-toggle-button" style="cursor:pointer; margin: 1px 10px 4px 3px; min-height: 15px;">')
          .text(useBlocksByDefault ? 'Blocks' : 'Text')
          .insertBefore($(aceEditor.container.parentElement).find('.bar-status').find('.label').last());

        // Store the value of ace, which could change as the result of
        // mutations we do to it and its associated Droplet. We will restore
        // the original value of the editor after we are done.
        var currentValue = aceEditor.getValue();

        // Create the Droplet editor.
        var dropletEditor = aceEditor._dropletEditor = new droplet.Editor(aceEditor, lookupOptions(aceEditor.getSession().$modeId), worker);

        // Set up the toggle button to toggle the Droplet editor block mode.
        button.click(function() {
          dropletEditor.toggleBlocks();
          useBlocksByDefault = dropletEditor.session.currentlyUsingBlocks;
          settings.set("user/cs50/droplet/@useBlocksByDefault", useBlocksByDefault);
          button.text(useBlocksByDefault ? 'Blocks' : 'Text');
        });

        // Set up tooltips. Every time the Droplet palette changes, we will go through
        // all the elements in it and add a Reference50 tooltip to it.
        dropletEditor.on('palettechange', function() {
          $(dropletEditor.paletteCanvas.children).each(function(index) {
            var title = Array.from(this.children).filter(function(child) { return child.tagName === 'title'; })[0];

            if (title != null) {
              this.removeChild(title);

              var element = $('<div>').html(title.textContent)[0];

              $(this).tooltipster({
                position: 'top',
                interactive: true,
                content: element,
                theme: ['tooltipster-noir', 'tooltipster-noir-customized'],
                contentCloning: true,
                maxWidth: 300
              });
            }
          });
        });

        // Restore the top margin that the Ace editor had, which makes
        // it look continguous with the top tab.
        dropletEditor.wrapperElement.style.top = '7px';

        // Update the Ace editor value every time Droplet changes -- we
        // need this for getValue() to work correctly, since Cloud9 accesses
        // ace.session.document directly, and this is difficult to intercept.
        dropletEditor.on('change', function() {
          setTimeout(function() {
            if (dropletEditor.session && dropletEditor.session.currentlyUsingBlocks) {
              dropletEditor.setAceValue(dropletEditor.getValue());
            }
          }, 0);
        })

        // Now restore the original value.
        aceEditor._dropletEditor.setValueAsync(currentValue);

        // Bind to session changes to change or create
        // Droplet sessions as necessary
        aceEditor.on("changeSession", function(e) {
          // If we don't already have a session corresponding to this
          // Ace session, create one.
          if (!aceEditor._dropletEditor.hasSessionFor(e.session)) {
            var option = lookupOptions(e.session.$modeId);
            if (option != null) {
              aceEditor._dropletEditor.bindNewSession(option);
            }
          }

          var aceSession = e.session:

          // Bind to mode changes on this new session to update the Droplet mode
          // as well.
          e.session.on('changeMode', function(event) {
            updateDropletMode(aceEditor);
          });
        });

        // Similarly bind to mode changes on the original session.
        aceEditor.getSession().on('changeMode', function(e) {
          updateDropletMode(aceEditor);
        });

        // Bind to the associated resize event. We will do this by
        // looking for the tab that contains this ace editor and binding
        // to its resize event.
        //
        // Also perform a hack to deal with document loading. At the time of the
        // document load event, Ace editors are actually empty, so in our initialization above/
        // in Droplet's session switching code, it will be loading an empty document, and won't know
        // to update block mode when it changes again (we don't listen for changes in the Ace editor).
        // So, on document load, listen once for a change event, and immediately update.
        tabManager.getTabs().forEach(function(tab) {
          var ace = tab.path && tab.editor.ace;
          if (ace == aceEditor && tab.editorType == 'ace') {
            tab.editor.on('resize', function() {
              dropletEditor.resize();
            });

            tab.editor.on('documentLoad', function(e) {
              e.doc.once('changed', function() {
                aceEditor._dropletEditor.setValueAsync(e.doc.value);
              });
            });
          }
        });

        aceEditor._signal("changeStatus");
      }

      // lookupOptions
      //
      // Look up a Droplet options object associated
      // with an Ace language mode.
      function lookupOptions(mode) {
        if (mode in OPT_MAP) {
          var result = OPT_MAP[mode];
          result.textModeAtStart = !useBlocksByDefault;
          return result;
        }
        else {
          return null;
        }
      }

      // Component functions of lookupOptions() to look
      // up one property at at time
      function lookupMode(id) {
        return (OPT_MAP[id] || {mode: null}).mode;
      }
      function lookupModeOptions(id) {
        return (OPT_MAP[id] || {mode: null}).modeOptions;
      }
      function lookupPalette(id) {
        return (OPT_MAP[id] || {palette: null}).palette;
      }

    }

    // Destroy function for Droplet. TODO
    function detachFromAce(ace) {

    }

    /***** Lifecycle *****/

    plugin.on("load", function() {
      load();
    });
    plugin.on("unload", function() {
      unload();
    });

    /***** Register and define API *****/

    plugin.freezePublicAPI({

    });

    register(null, {
      "c9.ide.cs50.droplet": plugin
    });
  }
});
