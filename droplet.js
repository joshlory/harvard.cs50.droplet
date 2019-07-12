console.log('init');
debugger;

define([
        './lib/droplet/droplet-full.js',
        './lib/jquery.min.js',
        './lib/tooltipster/dist/js/tooltipster.bundle.js',
        'text!./lib/droplet/droplet.c_ss',
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

                var BIGGER_CONTEXTS = {
                    "labeledStatement": "blockItemList",
                    "compoundStatement": "blockItemList",
                    "expressionStatement": "blockItemList",
                    "selectionStatement": "blockItemList",
                    "iterationStatement": "blockItemList",
                    "jumpStatement": "blockItemList",
                    "statement": "blockItemList",
                    "declaration": "blockItemList",
                    "specialMethodCall": "blockItemList",
                    "structDeclaration": "structDeclarationList",
                    "externalDeclaration": "translationUnit",
                    "functionDefinition": "translationUnit"
                }

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

                main.consumes = ["Plugin", "tabManager", "ace", "ui", "commands", "menus", "settings", "dialog.confirm", "dialog.error", "dialog.alert", "closeconfirmation", "debugger", "clipboard", "timeslider", "save"];

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
                    var debug = imports.debugger;
                    var dialogConfirmPlugin = imports.dialogConfirm;
                    var dialogConfirm = imports.dialogConfirm.show;
                    var dialogError = imports.dialogError.show;
                    var dialogAlert = imports.dialogAlert.show;
                    var clipboard = imports.clipboard;
                    var timeslider = imports.timeslider;
                    var timeslider_visible = false;
                    var _ = require('lodash');

                    debug.on('frameActivate', function(event) {
                        if (event.frame != null) {
                            console.log(event.frame.data.path, tabManager.getTabs());

                            var tab = tabManager.getTabs().filter(function(tab) { return tab.path === event.frame.data.path })[0];

                            if (tab != null && tab.editorType == "ace" && tab.editor.ace._dropletEditor != null) {
                                var editor = tab.editor.ace._dropletEditor;
                                var session = editor.sessions.get(tab.editor.ace.getSession());
                                if (session && session.currentlyUsingBlocks) {
                                    editor.redrawMain();
                                    editor.clearLineMarks();
                                    session.markLine(event.frame.data.line, {color: '#FF0'});
                                    editor.redrawMain();
                                }
                            }
                        }
                        else {
                            tabManager.getTabs().forEach(function(tab) {
                                if (tab != null && tab.editorType == "ace" && tab.editor.ace._dropletEditor != null) {
                                    tab.editor.ace._dropletEditor.clearLineMarks();
                                }
                            });
                        }
                    });

                    /***** Initialization *****/

                    var plugin = new Plugin("CS50", main.consumes);
                    var emit = plugin.getEmitter();

                    window._lastEditor = null; // This is a debug variable/

                    /*
                    settings.on("read", function() {
                        settings.setDefaults("user/cs50/droplet", [
                            ["useBlocksByDefault", false]
                            ]);
                    });
                    */

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
                        function forceAddCss(text) {
                            var linkElement = document.createElement('link');
                            linkElement.setAttribute('rel', 'stylesheet');
                            linkElement.setAttribute('href',
                                    URL.createObjectURL(new Blob([text], {'type': 'text/css'}))
                                    );
                            document.head.appendChild(linkElement);
                        }
                        forceAddCss(pluginStyleText);
                        forceAddCss(dropletStyleText);
                        forceAddCss(tooltipsterStyleText);

                        // Load user setting for whether to open new files
                        // in blocks mode or not
                        // useBlocksByDefault = settings.get("user/cs50/droplet/@useBlocksByDefault");

                        updateNight();

                        settings.on("user/general/@skin", updateNight, plugin);
                    }

                    // Toggle night theme of droplet editor associated with `tab` according to `night`.
                    function setNightTheme(tab, night) {
                        if (tab.path && tab.editor.ace && tab.editorType === 'ace' && tab.editor.ace._dropletEditor) {
                            tab.editor.ace._dropletEditor.sessions.forEach(function(session) {
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
                    }
                    // Bind to changes in skin. When we switch to/from dark/light mode,
                    // update the "invert" flag on Droplet and swap color schemes.
                    function updateNight() {
                        let night = settings.get('user/general/@skin').indexOf('dark') !== -1;
                        // Toggle all existing sessions
                        tabManager.getTabs().forEach(function (tab) { setNightTheme(tab, night); });
                        // Update default for new creations
                        for (var mode in OPT_MAP) {
                            OPT_MAP[mode].viewSettings.invert = night;
                            var target_colors = (night ? NIGHT_COLORS : DAY_COLORS);
                            for (key in target_colors) {
                                OPT_MAP[mode].viewSettings.colors[key] = target_colors[key];
                            }
                        }
                    }

                    updateNight();

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
                            if (tab.path && tab.editorType === "ace" && tab.editor.ace && tab.editor.ace._dropletEditor && tab.editor.ace._dropletEditor.hasSessionFor(tab.document.getSession().session)) {
                                var aceEditor = tab.editor.ace;

                                // Count the number of floating blocks
                                var nBlocks = tab.editor.ace._dropletEditor.sessions.get(tab.document.getSession().session).floatingBlocks.length;

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
                                            tab.document.meta.ignoreSave = true;
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

                    function findAssociatedTab(aceEditSession, fn) {
                        var tabs = tabManager.getTabs();
                        for (var i = 0; i < tabs.length; i++) {
                            if (tabs[i].document && tabs[i].document.getSession() && tabs[i].document.getSession().session == aceEditSession) {
                                return fn(tabs[i]);
                            }
                        }
                        return null;
                    }


                    // Bind to copy/paste/cut
                    clipboard.on('copy', function(e) {
                        if (e.native) return;

                        // Get the active tab
                        var tab = tabManager.focussedTab;
                        if (!tab || !tab.editor || !tab.editor.ace) return;
                        var focusedDropletEditor = tab.editor.ace._dropletEditor;

                        if (!focusedDropletEditor || !focusedDropletEditor.session.currentlyUsingBlocks) return;

                        // Copy
                        if (focusedDropletEditor.lassoSelection != null) {
                            e.clipboardData.setData('text/plain', focusedDropletEditor.lassoSelection.stringifyInPlace());
                        }

                    });

                    clipboard.on('paste', function(e) {
                        if (e.native) return;

                        // Get the active tab
                        var tab = tabManager.focussedTab;
                        if (!tab || !tab.editor || !tab.editor.ace) return;
                        var focusedDropletEditor = tab.editor.ace._dropletEditor;

                        if (!focusedDropletEditor || !focusedDropletEditor.session.currentlyUsingBlocks) return;

                        // Paste
                        var data = e.clipboardData.getData('text/plain');
                        focusedDropletEditor.pasteTextAtCursor(data);
                    });

                    clipboard.on('cut', function(e) {
                        // Get the active tab
                        var tab = tabManager.focussedTab;
                        if (!tab || !tab.editor || !tab.editor.ace) return;
                        var focusedDropletEditor = tab.editor.ace._dropletEditor;

                        if (!focusedDropletEditor || !focusedDropletEditor.session.currentlyUsingBlocks) return;

                        // Copy
                        if (focusedDropletEditor.lassoSelection != null) {
                            e.clipboardData.setData('text/plain', focusedDropletEditor.lassoSelection.stringifyInPlace());

                            // Delete
                            focusedDropletEditor.deleteSelection();
                        }
                    });

                    // Takes in an EditSession and a dropletEditor instance, and copies over whether or not blocks are being used,
                    // cursor position, and floating blocks from the document associated with the EditSession to the droplet.Editor instance.
                    // Additionally, calls updateNight() to ensure that colors are correct.
                    function restoreDropletState(session, dropletEditor) {
                        findAssociatedTab(session, function(tab) {
                            // Fix colors if necessary
                            let night = settings.get('user/general/@skin').indexOf('dark') !== -1;
                            setNightTheme(tab, night);

                            // Activate the droplet.Editor if the previous document is in blocks mode
                            let usingBlocks = tab.document.getState().meta.usingBlocks;
                            if (usingBlocks != null) {
                                dropletEditor.setEditorState(usingBlocks);
                            }

                            let dropletState = tab.document.getState().meta.dropletState;
                            if (dropletState == null) return;

                            // If dropletEditor already has the correct floating blocks, no need (yet) to redraw the main canvas
                            let redraw = false;
                            if (dropletState.floatingBlocks != null && !_.isEqual(dropletState.floatingBlocks, dropletEditor.session.floatingBlocks)) {
                                dropletEditor.session.setFloatingBlocks(dropletState.floatingBlocks);
                                redraw = true;
                            }

                            if (dropletState.cursor != null) {
                                // dropletState.cursor may no longer be a CrossDocumentLocation object (e.g. if there was a refresh). We should restore it if so.
                                // Comparing constructors seems like a really hackish way to determine if two instances are of the same class but that's what StackOverflow said to do.
                                if (dropletState.cursor.constructor != dropletEditor.session.cursor.constructor) {
                                    let cursor = dropletEditor.session.cursor;
                                    Object.setPrototypeOf(dropletState.cursor.location, cursor.location);
                                    Object.setPrototypeOf(dropletState.cursor, cursor);
                                }
                                // If dropletEditor already has the correct cursor position, no need to redraw the main canvas.
                                if (!_.isEqual(dropletState.cursor, dropletEditor.session.cursor)) {
                                    dropletEditor.session.cursor = dropletState.cursor;
                                    redraw = true;
                                }
                            }
                            if (redraw) dropletEditor.redrawMain();
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
                            var dropletEditor;

                            var originalSession = aceEditor.getSession();

                            function onClickToggle() {
                                // <hack> This addresses an issue where droplet blocks would be at the wrong indentation level
                                // if the cursor started at the wrong indentation level. See issue #64 (the comments).
                                // To get around this, we calculate the appropriate indentation level (from ACE) and replace 
                                // the current line with the proper amount of indentation.
                                if (!dropletEditor.session.currentlyUsingBlocks) {
                                    findAssociatedTab(dropletEditor.sessions.getReverse(dropletEditor.session), function(tab) {
                                        ace = tab.editor.ace;
                                        session = ace.getSession();

                                        // Get the current and previous line
                                        row = ace.getCursorPosition().row;
                                        lines = session.getLines(row - 1, row);
                                        // Abort if there is no previous line or if the current line contains non-whitespace characters
                                        if (lines.length <= 1 || lines[1].trim()) return;

                                        // Replace the current line with the proper amount of indentation
                                        indent = session.getMode().getNextLineIndent("start", lines[0], session.getTabString());
                                        session.replace({
                                            start: {row: row, column: 0},
                                            end: {row: row, column: Number.MAX_VALUE}
                                        }, indent);
                                    });
                                // </hack>

                                }

                                if (!dropletEditor.session) return;

                                dropletEditor.toggleBlocks(function(result) {
                                    if (result && result.success === false) {
                                        dialogError("Cannot convert to blocks! Does your code compile? Does it contain a syntax error?");
                                    }
                                    // In case of failure, set the button text to always
                                    // reflect the actual blocks/text state of the editor.
                                    //
                                    // The editor state flag will be set to reflect the true state of the
                                    // editor after the toggle animation is done.

                                    findAssociatedTab(dropletEditor.sessions.getReverse(dropletEditor.session), function(tab) {
                                        let state = tab.document.getState();
                                        state.meta.usingBlocks = dropletEditor.session.currentlyUsingBlocks;
                                        tab.document.setState(state);
                                    });

                                    correctButtonDisplay();
                                });

                            }

                            settings.on("user/collab/@timeslider-visible", function(value) {
                                timeslider_visible = value;
                                correctButtonDisplay();
                            });

                            // Store the value of ace, which could change as the result of
                            // mutations we do to it and its associated Droplet. We will restore
                            // the original value of the editor after we are done.
                            var currentValue = aceEditor.getValue();

                            // Create the Droplet editor.
                            var dropletEditor = aceEditor._dropletEditor = new droplet.Editor(aceEditor, lookupOptions(aceEditor.getSession().$modeId), worker);
                            restoreDropletState(aceEditor.getSession(), dropletEditor);

                            var button = $('<div class="label droplet-toggle-button material-icons"' +
                                'style="cursor:pointer; margin: 1px 5px 4px 3px;' +
                                'min-height: 15px; max-width: 40px; overflow: hidden; font-family: \'Material Icons\';' +
                                'font-size:18px;">').text('subject');

                            // Find the editor tab
                            var el = aceEditor.container.parentElement;

                            while (!$(el).hasClass('editor_tab')) {
                                el = el.parentElement;
                            }

                            ace.getElement("menu", function(menu) {
                                menu.on("prop.visible", function(e) {
                                    e.currentTarget
                                     .childNodes
                                     .filter(function(item) {
                                         return ["Cut", "Copy", "Paste", "Select All", "File History"].includes(item.caption);
                                     })
                                     .forEach(function(item) {
                                         if (dropletEditor.session && dropletEditor.session.currentlyUsingBlocks) {
                                             item.disable();
                                         } else {
                                             item.enable();
                                         }
                                     }); 
                                });
                            });

                            // I'm sure there is a better way to inject the button than using JQuery, but this is how it was originally written.
                            function injectButton() {
                                button.insertAfter($(el).find('.bar-status').find('.label').last());
                            }

                            // Any time we leave presentation mode, we need to add the button back
                            settings.on("user/ace/statusbar/@show", function(showing) {
                                if (showing === "true") {
                                    injectButton()
                                }
                            });

                            injectButton()

                            function correctButtonDisplay() {
                                if (timeslider_visible) {
                                    button.css('display', 'none');
                                    if (dropletEditor.session) {
                                        dropletEditor.setEditorState(false);
                                    }
                                }
                                else {
                                    button.css('display', (dropletEditor.session ? 'inline-block' : 'none'));
                                    if (dropletEditor.session) {
                                        button.text(dropletEditor.session.currentlyUsingBlocks ? 'subject' : 'extension');
                                        /*
                                        if (dropletEditor.session.currentlyUsingBlocks) {
                                            blocksButtonDisplay.style.display = 'block';
                                            textButtonDisplay.style.display = 'none';
                                        }
                                        else {
                                            blocksButtonDisplay.style.display = 'none';
                                            textButtonDisplay.style.display = 'block';
                                        }*/
                                    }
                                }
                            }

                            window._last_button = button;

                            button.click(onClickToggle);
                            correctButtonDisplay();

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
                                findAssociatedTab(dropletEditor.sessions.getReverse(dropletEditor.session), function(tab) {
                                    setTimeout(function() {
                                        changed = false;
                                        if (dropletEditor.session && dropletEditor.session.currentlyUsingBlocks) {
                                            let lastAceValue = dropletEditor.aceEditor.getValue();
                                            if (lastAceValue !== dropletEditor.getValue()) {
                                                dropletEditor.setAceValue(dropletEditor.getValue());
                                                tab.document.undoManager.add({undo: function() {} , redo: function() {}});
                                                tab.document.meta.ignoreSave = false;
                                                changed = true;
                                            }

                                            // Save floating blocks
                                            setTimeout(function() {
                                                let state = tab.document.getState();
                                                state.meta.dropletState = {
                                                    cursor: dropletEditor.session.cursor,
                                                    floatingBlocks: dropletEditor.session.floatingBlocks.map(function(block) {
                                                                        return {
                                                                            text: block.block.stringify(),
                                                                            context: BIGGER_CONTEXTS[block.block.indentContext] || block.block.indentContext,
                                                                            pos: {
                                                                                x: block.position.x,
                                                                                y: block.position.y
                                                                            }
                                                                        }
                                                                    })
                                                }
                                                state.changed = changed;
                                                tab.document.setState(state);
                                            }, 0);
                                        }
                                    }, 0);
                                });
                            })


                            // Now restore the original value.
                            if (aceEditor._dropletEditor.session && aceEditor._dropletEditor.session.currentlyUsingBlocks) {
                                aceEditor._dropletEditor.setValueAsync(currentValue, null, originalSession);
                            } else {
                                aceEditor._dropletEditor.setValue(currentValue, originalSession);
                            }

                            // Bind to session changes to change or create
                            // Droplet sessions as necessary
                            aceEditor.on("changeSession", function(e) {
                                // If we don't already have a session corresponding to this
                                // Ace session, create one.
                                if (!aceEditor._dropletEditor.hasSessionFor(e.session)) {
                                    var option = lookupOptions(e.session.$modeId);
                                    if (option != null) {
                                        aceEditor._dropletEditor.bindNewSession(option);

                                        // Populate with floating blocks if necessary
                                        restoreDropletState(e.session, dropletEditor);
                                    } else {
                                        aceEditor._dropletEditor.updateNewSession(null);
                                    }

                                    correctButtonDisplay();

                                    var aceSession = e.session;

                                    // Bind to mode changes on this new session to update the Droplet mode
                                    // as well.
                                    e.session.on('changeMode', function(event) {
                                        if (aceEditor._dropletEditor.hasSessionFor(aceEditor.getSession())) {
                                            // Set the mode and the palette, if there are some
                                            var option = lookupOptions(aceEditor.getSession().$modeId);
                                            if (option != null) {
                                                aceEditor._dropletEditor.setMode(lookupMode(aceEditor.getSession().$modeId), lookupModeOptions(aceEditor.getSession().$modeId));
                                                aceEditor._gropletEditor.setPalette(lookupPalette(aceEditor.getSession().$modeId));
                                            }

                                            // Otherwise, destroy the session.
                                            else {
                                                aceEditor._dropletEditor.setEditorState(false);
                                                aceEditor._dropletEditor.updateNewSession(null);
                                                aceEditor._dropletEditor.sessions.remove(aceEditor.getSession());
                                            }
                                        } else {
                                            // If we didn't originally bind a session (i.e. the editor
                                            // started out in a language that wasn't supported by Droplet),
                                            // create one now before setting the language mode.
                                            var option = lookupOptions(aceEditor.getSession().$modeId);
                                            if (option != null) {
                                                aceEditor._dropletEditor.bindNewSession(option);
                                            }

                                            // If we're switching to a language we don't recognize, destroy the current
                                            // session.
                                            else {
                                                aceEditor._dropletEditor.setEditorState(false);
                                                aceEditor._dropletEditor.updateNewSession(null);
                                                aceEditor._dropletEditor.sessions.remove(aceEditor.getSession());
                                            }
                                        }
                                        correctButtonDisplay();
                                    });
                                } else {
                                    restoreDropletState(e.session, dropletEditor);
                                }

                                correctButtonDisplay();
                            });

                            // Similarly bind to mode changes on the original session.
                            aceEditor.getSession().on('changeMode', function(e) {
                                if (aceEditor._dropletEditor.hasSessionFor(aceEditor.getSession())) {
                                    // Set the mode and the palette, if there are some
                                    var option = lookupOptions(aceEditor.getSession().$modeId);
                                    if (option != null) {
                                        aceEditor._dropletEditor.setMode(lookupMode(aceEditor.getSession().$modeId), lookupModeOptions(aceEditor.getSession().$modeId));
                                        aceEditor._dropletEditor.setPalette(lookupPalette(aceEditor.getSession().$modeId));
                                    }

                                    // Otherwise, destroy the session.
                                    else {
                                        aceEditor._dropletEditor.setEditorState(false);
                                        aceEditor._dropletEditor.updateNewSession(null);
                                        aceEditor._dropletEditor.sessions.remove(aceEditor.getSession());
                                    }
                                } else {
                                    // If we didn't originally bind a session (i.e. the editor
                                    // started out in a language that wasn't supported by Droplet),
                                    // create one now before setting the language mode.
                                    var option = lookupOptions(aceEditor.getSession().$modeId);
                                    if (option != null) {
                                        aceEditor._dropletEditor.bindNewSession(option);
                                    }

                                    // If we're switching to a language we don't recognize, destroy the current
                                    // session.
                                    else {
                                        aceEditor._dropletEditor.setEditorState(false);
                                        aceEditor._dropletEditor.updateNewSession(null);
                                        aceEditor._dropletEditor.sessions.remove(aceEditor.getSession());
                                    }
                                }
                                correctButtonDisplay();
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

                                    /*
                                    tab.editor.on('documentLoad', function(e) {
                                        var currentSession = aceEditor.getSession();
                                        var alreadyDone = false;
                                        e.doc.on('changed', function() {
                                            if (alreadyDone) return;
                                            alreadyDone = true;
                                            setTimeout(function() {
                                                var dSession = aceEditor._dropletEditor.sessions.get(currentSession);
                                                if (dSession == aceEditor._dropletEditor.session && e.doc.value != aceEditor._dropletEditor.getValue()) {
                                                    if (aceEditor._dropletEditor.session.currentlyUsingBlocks) {
                                                        aceEditor._dropletEditor.setValueAsync(currentValue, null, currentSession);
                                                    } else {
                                                        aceEditor._dropletEditor.setValue(currentValue, currentSession);
                                                    }
                                                }
                                            }, 0);
                                        });
                                    });
                                    // This code is no longer necessary as documents are never loaded
                                    // in blocks mode. TODO: this will need to be fixed if documents get loaded in blocks mode.
                                    */
                                }
                            });

                            aceEditor._signal("changeStatus");
                        }

                        function deepCopy(object) {
                            if (typeof object == 'string' || typeof object == 'number' || typeof object == 'boolean'
                                || object instanceof String || object instanceof Number) {
                                return object;
                            }
                            else if (object instanceof Array) {
                                return object.map(deepCopy);
                            }
                            else {
                                var result = {};
                                for (var key in object) {
                                    result[key] = deepCopy(object[key]);
                                }
                                return result;
                            }
                        }

                        function getCurrentSoftTab() {
                            var n = settings.getNumber("project/ace/@tabSize");
                            var result = '';
                            for (var i = 0; i < n; i++) result += ' ';
                            return result;
                        }

                        function formatPaletteTabs(palette) {
                            if (!palette) return palette;
                            var softtab = getCurrentSoftTab();
                            return palette.map(function(category) {
                                var result = deepCopy(category);
                                result.blocks = result.blocks.map(function(block) {
                                    var rblock = deepCopy(block);
                                    rblock.block = rblock.block.replace(/\t/g, softtab);
                                    return rblock;
                                });
                                return result;
                            });
                        }

                        settings.on("project/ace/@tabSize", function(value){
                            tabManager.getTabs().forEach(function(tab) {
                                var ace = tab.path && tab.editor.ace;
                                if (ace && tab.editorType == 'ace' && ace._dropletEditor &&
                                        ace._dropletEditor.hasSessionFor(tab.document.getSession().session)) {
                                    ace._dropletEditor.setPalette(
                                        lookupPalette(tab.document.getSession().session.$modeId),
                                        ace._dropletEditor.sessions.get(
                                            tab.document.getSession().session
                                        )
                                    );
                                }
                            });
                        }, plugin);

                        // lookupOptions
                        //
                        // Look up a Droplet options object associated
                        // with an Ace language mode.
                        function lookupOptions(mode) {
                            if (mode in OPT_MAP) {
                                var result = deepCopy(OPT_MAP[mode]);
                                result.textModeAtStart = true; //!useBlocksByDefault
                                result.palette = formatPaletteTabs(result.palette);
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
                            return formatPaletteTabs((OPT_MAP[id] || {palette: null}).palette);
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
