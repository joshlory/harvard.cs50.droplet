define([
    './lib/droplet/droplet-full.js',
    './lib/jquery.min.js',
    './lib/tooltipster/dist/js/tooltipster.bundle.js',
    'text!./lib/droplet/droplet.css',
    'text!./lib/tooltipster/dist/css/tooltipster.bundle.min.css',
    'text!./css/style.css',
    'text!./lib/droplet/worker.js',
    'text!./droplet-configs/c_cpp.json'
],
function(
    droplet,
    _,
    tooltipster,
    dropletStyleText,
    tooltipsterStyleText,
    pluginStyleText,
    workerScriptText,
    dropletConfigText
) {
  var $ = jQuery;

  var worker = null;

  var DAY_COLORS = {
    "value": "#94c096",
    "assign": "#f3a55d",
    "declaration": "#f3a55d",
    "type": "#f3a55d",
    "control": "#ecc35b",
    "function": "#b593e6",
    "functionCall": "#889ee3",
    "logic": "#6fc2eb",
    "struct": "#f58c4f",
    "return": "#b593e6"
  };

  var NIGHT_COLORS = {
    "value": "#5CB712",
    "assign": "#EE7D16",
    "declaration": "#EE7D16",
    "type": "#EE7D16",
    "control": "#c78f00",
    "function": "#632D99",
    "functionCall": "#4A6CD4",
    "logic": "#2CA5E2",
    "struct": "#C88330",
    "return": "#632D99"
  };

  // createWorker
  //
  // Worker hack to avoid cross-domain issues. In the case where
  // we are not allowed to request the worker URL, create a worker with just
  // an importScripts() call to it, which should get around cross-domain
  // security.
  function createWorker(text) {
      var blob = workerBlob(text);
      var URL = window.URL || window.webkitURL;
      var blobURL = URL.createObjectURL(blob);

      var worker = new Worker(blobURL);

      setTimeout(function() { // IE EDGE needs a timeout here
          URL.revokeObjectURL(blobURL);
      });

      return worker;
  };

  // workerBlob
  //
  // Create the importScripts() shim for use in createWorker()
  function workerBlob(script) {
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
    'ace/mode/c_cpp': JSON.parse(dropletConfigText)
  };

  var useBlocksByDefault = true;

  main.consumes = ["Plugin", "tabManager", "ace", "ui", "commands", "menus", "settings", "dialog.confirm"];
  main.provides = ["c9.ide.cs50.droplet"];
  return main;
    // updateDropletMode
    //
    // Update the Droplet language mode to refelct the Ace editor
    // Droplet mode.
    function updateDropletMode(aceEditor) {
    }

  function main(options, imports, register) {
    var Plugin = imports.Plugin;
    var tabManager = imports.tabManager;
    var ace = imports.ace;
    var ui = imports.ui;
    var commands = imports.commands;
    var menus = imports.menus;
    var settings = imports.settings;
    var dialogConfirm = imports["dialog.confirm"].show;

    /***** Initialization *****/

    var plugin = new Plugin("CS50", main.consumes);
    var emit = plugin.getEmitter();

    window._lastEditor = null; // This is a debug variable/

    settings.on("read", function() {
      settings.setDefaults("user/cs50/droplet", [
          ["useBlocksByDefault", false]
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
                
        function(session, doc) {
            if (session._dropletSession) {
                return session._dropletSession.floatingBlocks.map(function(record) {
                    return {
                        doc_context: record.block.parseContext,
                        doc: record.block.stringify(),
                        pos: record.position
                    };
                });
            }
            else {
                return null
            }
        },
        
        function(blocks, session, ace) {
            if (blocks != null && session._dropletSession) {
                blocks.forEach(function(obj) {
                    session._dropletSession.addFloatingBlock(obj);
                });
            }`
        }

        });

      // Hack to add necessary stylesheets, because ui.insertCss
      // does not work here for some reason. Append
      // <link> elements to the top of the page.
      function forceAddCss(text) {
        var linkElement = document.createElement('link');
        linkElement.setAttribute('rel', 'stylesheet');
        linkElement.setAttribute('href',
          URL.createObjectURL(new Blob([text], {'type': 'text/css'}))
        );
        document.head.appendChild(linkElement);
      }
      forceAddCss(dropletStyleText);
      forceAddCss(tooltipsterStyleText);
      forceAddCss(pluginStyleText);

      // Load user setting for whether to open new files
      // in blocks mode or not
      useBlocksByDefault = settings.get("user/cs50/droplet/@useBlocksByDefault");

      updateNight();

      settings.on("user/general/@skin", updateNight, plugin);
    }

    // Bind to changes in skin. When we switch to/from dark/light mode,
    // update the "invert" flag on Droplet and swap color schemes.
    function updateNight() {
      night = settings.get('user/general/@skin').indexOf('dark') !== -1;
      tabManager.getTabs().forEach(function(tab) {
        if (tab.path && tab.editor.ace && tab.editorType === 'ace') {
          // Toggle all existing sessions
          tab.editor.ace._dropletEditor.sessions.forEach(function(session) {
            console.log('Updating session', session.tree.stringify());
            session.views.forEach(function(view) {
              view.opts.invert = night;
              var target_colors = (night ? NIGHT_COLORS : DAY_COLORS);
              for (key in target_colors) {
                  view.opts.colors[key] = target_colors[key];
              }
              view.clearCache();
            });
          });
          // Rerender current session
          tab.editor.ace._dropletEditor.updateNewSession(tab.editor.ace._dropletEditor.session);
        }
      });
      // Update default for new creations
      for (var mode in OPT_MAP) {
        OPT_MAP[mode].viewSettings.invert = night;
          var target_colors = (night ? NIGHT_COLORS : DAY_COLORS);
          for (key in target_colors) {
              OPT_MAP[mode].viewSettings.colors[key] = target_colors[key];
          }
      }
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
    var worker = createWorker(workerScriptText);

    tabManager.getTabs().forEach(bindToClose);
    tabManager.on("open", function(e) {
        bindToClose(e.tab);
    });

    function bindToClose(tab) {
        tab.on('beforeClose', function() {
            // If the tab has already been checked by us, continue
            if (tab.meta._floatingBlockDoomed) {
                return true;
            }

            // Otherwise, if we should pop up a dialog, do so
            if (tab.path && tab.editorType === "ace" && tab.editor.ace && tab.editor.ace._dropletEditor) {
                var aceEditor = tab.editor.ace;

                // Count the number of floating blocks
                var nBlocks = aceEditor._dropletEditor.session.floatingBlocks.length;

                if (nBlocks > 0) {
                    dialogConfirm(
                        "Confirm close",
                        "Are you sure you want to close this tab?",
                        "You have " +
                        nBlocks +
                        " " + (nBlocks === 1 ? "piece" : "pieces") +
                        " of code not connected to your program. If you close the tab, these pieces will disappear. Are you sure you want to close this tab?",

                        function() {
                            tab.meta._floatingBlockDoomed = true;
                            tab.close();
                        },

                        function() {
                            // pass
                        }
                    );

                    return false;
                }
            }
        });
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

        button.css('display', (dropletEditor.session ? 'inline' : 'none'));

        // Set up the toggle button to toggle the Droplet editor block mode.
        button.click(function() {
           // Toggle, but we might want to do some confirmations first.
           var continueToggle = function() {
               dropletEditor.toggleBlocks(function() {
                 // In case of failure, set the button text to always
                 // reflect the actual blocks/text state of the editor.
                 //
                 // The editor state flag will be set to reflect the true state of the
                 // editor after the toggle animation is done.
                 button.text(dropletEditor.session.currentlyUsingBlocks ? 'Blocks' : 'Text');
               });

               // However, udpate the default blocks/text setting to always reflect what the user
               // expected the editor state to ultimately be.
               useBlocksByDefault = dropletEditor.session.currentlyUsingBlocks;
               settings.set("user/cs50/droplet/@useBlocksByDefault", useBlocksByDefault);
               button.text(useBlocksByDefault ? 'Blocks' : 'Text');
           }

           // If there are floating blocks, confirm
           if (dropletEditor.session.currentlyUsingBlocks && dropletEditor.session.floatingBlocks.length > 0) {
                var nBlocks = dropletEditor.session.floatingBlocks.length;
                dialogConfirm(
                    "Confirm toggle",
                    "Are you sure you want to switch to text?",
                    "You have " +
                    nBlocks +
                    " " + (nBlocks === 1 ? "piece" : "pieces") +
                    " of code not connected to your program. If you switch to text, these pieces will disappear. Are you sure you want to switch to text?",

                    continueToggle,

                    function() {
                        // pass
                    }
                );
            }

            else {
                continueToggle();
            }
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
          dropletEditor._c9CurrentlySettingAce = true;
          setTimeout(function() {
            if (dropletEditor.session && dropletEditor.session.currentlyUsingBlocks) {
              dropletEditor.setAceValue(dropletEditor.getValue());
              dropletEditor._c9CurrentlySettingAce = false;
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
            else {
              aceEditor._dropletEditor.updateNewSession(null);
            }
          }
          button.css('display', (dropletEditor.session ? 'inline' : 'none'));

          var aceSession = e.session;

          // Bind to mode changes on this new session to update the Droplet mode
          // as well.
          e.session.on('changeMode', function(event) {
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
              else {
                aceEditor._dropletEditor.updateNewSession(null);
              }
              button.css('display', (dropletEditor.session ? 'inline' : 'none'));
            }
          });
        });

        // Similarly bind to mode changes on the original session.
        aceEditor.getSession().on('changeMode', function(e) {
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
              var currentSession = aceEditor._dropletEditor.session;
              e.doc.on('changed', function() {
                setTimeout(function() {
                    if (e.doc.value != aceEditor._dropletEditor.getValue()) {
                      aceEditor._dropletEditor.setValueAsync(e.doc.value);
                    }
                }, 0);
              });
            });
          }
        });

        aceEditor._signal("changeStatus");
      }


      console.log("Binding to onbeforeunload");
      document.body.onbeforeunload = function() {

        var corruptTabs = tabManager.getTabs().filter(function(tab) {
            return (tab.path &&
                tab.editorType === "ace" &&
                tab.editor.ace &&
                tab.editor.ace._dropletEditor && 
                tab.editor.ace._dropletEditor.floatingBlocks.length > 0)
        }).length;

        if (corruptTabs.length > 0) {
            return "You have " + corruptTabs + " tabs open with pieces of code that are not attached to your programs. If you leave this page, those pieces will disappear. Are you sure you want to leave this page?";
        }
        else {
            return null;
        }
      };

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
